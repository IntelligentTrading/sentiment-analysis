var crypto_panic_api = require('../api/cryptopanic').cryptoPanic;
var dispatcher = require('../api/sentiment_dispatcher').dispatcher;
var feedsMath = require('../core/math').feedsMath;
var feed = require('../core/feed').feed;
var _ = require('lodash');
var redis = require('redis')
rclient = redis.createClient(process.env.REDIS_URL);

rclient.on("error", function (err) {
    console.log("Error " + err);
});

var feedRequestInterval = Boolean(process.env.LOCAL_ENV) ? 3000 : 30 * 60 * 1000;
var lastSentFeeds = 'lastSentFeeds';
var threshold_date = new Date()
threshold_date.setUTCHours(0, 0, 0, 0) // let's get today at midnight and all the today's feeds 

var feedManager = {
    /**
     * @description Gets the feeds for the last day only
     */
    latestFeed: () => setInterval(() => {
        crypto_panic_api.lastPage({ filter: 'hot' })
            .then(results => {
                var filtered_feeds = results.filter(res => new Date(res.created_at).getTime() > threshold_date.getTime());
                var sorted_feeds = _.orderBy(filtered_feeds, (ff) => ff.created_at, 'asc');

                sorted_feeds.map(selected_feed => {
                    //check if the news is duplicate or old
                    var redisFeeds = rclient.zrevrange(lastSentFeeds, 0, -1, (err, feedIds) => {
                        if (feedIds.filter(feedId => feedId == selected_feed.id).length <= 0) {

                            console.log(selected_feed)

                            rclient.zadd(lastSentFeeds, Date.parse(selected_feed.created_at), selected_feed.id, (err, reply) => {

                                rclient.zcard(lastSentFeeds, (err, cardinality) => {

                                    if (cardinality >= 100) {
                                        rclient.zremrangebyrank(lastSentFeeds, 0, 0, (err, removed) => {
                                            console.log(`INFO: ${lastSentFeeds} set refreshed`)
                                        })
                                    }
                                })
                            })
                            dispatcher.dispatch(selected_feed, 99);

                        }
                    })
                })
            })
            .catch(reason => console.log(reason))
    }, feedRequestInterval),
    /**
     * Gets the feeds from today to daysBack days
     * @param daysBack The number of days back from today for the feed retrival
     */
    getFeedAnalysisPerDays: (daysBack) => {

        if (!daysBack) {
            daysBack = 1;
        }

        var limitDate = new Date()
        limitDate.setDate(limitDate.getDate() - parseInt(daysBack))
        limitDate.setUTCHours(0, 0, 0, 0)

        return crypto_panic_api.all({ filter: 'hot' }, limitDate)
            .then(results => {
                var feeds = [];

                results.forEach(res => {
                    var unparsedFeed = {};
                    Object.keys(res.votes).forEach(key => {
                        unparsedFeed[key] = res.votes[key];
                    })

                    if (!res.currencies) {
                        res.currencies = []
                        res.currencies.push({ code: 'Generic' })
                    }

                    res.currencies.map(curr => {
                        unparsedFeed.date = res.created_at;
                        unparsedFeed.currency = curr.code;
                        unparsedFeed.id = res.id;
                        feeds.push(feed.parseFeed(unparsedFeed))
                    })
                })

                return feedsMath.getDailyReactions(feeds);

            }).catch(err => {
                console.log(err)
            })
    }
}


exports.feedManager = feedManager;