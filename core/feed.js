<<<<<<< HEAD
var feed = {
    parseFeed: (unparsedFeed) => {
        var split_feed = {};
        split_feed.news_id = unparsedFeed.id;
        split_feed.positive = unparsedFeed.positive;
        split_feed.negative = unparsedFeed.negative;
        split_feed.important = unparsedFeed.important;
        split_feed.sentiment = (unparsedFeed.positive - unparsedFeed.negative) / (unparsedFeed.positive + unparsedFeed.negative);
        split_feed.currency = unparsedFeed.currency;
        split_feed.date = unparsedFeed.date.split('T')[0];
        return split_feed;
=======
var crypto_panic_api = require('../api/cryptopanic').cryptoPanic;
var dispatcher = require('../api/sentiment_dispatcher').dispatcher;
var _ = require('lodash');
var fs = require('fs');
var redis = require('redis')
rclient = redis.createClient(process.env.REDIS_URL);

rclient.on("error", function (err) {
    console.log("Error " + err);
});

var logger = fs.createWriteStream('sentiment.txt', {
    flags: 'a' // 'a' means appending (old data will be preserved)
})

var feedRequestInterval = 30 * 60 * 1000; 

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

                            dispatcher.dispatch(selected_feed, 0);
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
    getFeedRange: (daysBack) => {

        if (!daysBack) {
            daysBack = 1;
        }

        var limitDate = new Date()
        limitDate.setDate(limitDate.getDate() - parseInt(daysBack))
        limitDate.setUTCHours(0, 0, 0, 0)

        crypto_panic_api.all({ filter: 'hot' }, limitDate)
            .then(results => {
                var feeds = [];

                results.forEach(res => {
                    var feed = {};
                    Object.keys(res.votes).forEach(key => {
                        feed[key] = res.votes[key];
                    })
                    feed.date = res.created_at;

                    if (!res.currencies) {
                        res.currencies = []
                        res.currencies.push({ code: 'Generic' })
                    }

                    res.currencies.map(curr => {
                        var split_feed = {};
                        split_feed.news_id = res.id;
                        split_feed.positive = feed.positive;
                        split_feed.negative = feed.negative;
                        split_feed.important = feed.important;
                        split_feed.sentiment = (feed.positive - feed.negative) / (feed.positive + feed.negative);
                        split_feed.currency = curr.code;
                        split_feed.date = feed.date.split('T')[0];
                        feeds.push(split_feed);
                    })

                })

                var grouped_feeds = _.groupBy(feeds, feed => feed.currency)

                var grouped_curr_summary = _.keys(grouped_feeds).map(curr => {
                    return {
                        curr: curr,
                        occurrencies: grouped_feeds[curr].length
                    }
                })

                feeds.forEach(feed => {
                    var entry = `${feed.currency},${feed.positive},${feed.negative},${feed.important},${feed.date} [${feed.news_id}]`;
                    console.log(entry)
                    logger.write(entry + '\n');
                })

                logger.end();
            }).catch(err => {
                console.log(err)
            })
>>>>>>> master
    }
}

exports.feed = feed;