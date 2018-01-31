var crypto_panic_api = require('../api/cryptopanic').cryptoPanic;
var dispatcher = require('../api/sentiment_dispatcher').dispatcher;
var _ = require('lodash');
var fs = require('fs');

var logger = fs.createWriteStream('sentiment.txt', {
    flags: 'a' // 'a' means appending (old data will be preserved)
})

var last_sent_feeds = [];
var threshold_date = new Date()
threshold_date.setUTCHours(0, 0, 0, 0) // let's get today at midnight and all the today's feeds 

var feedManager = {
    latestFeed: () => setInterval(() => {
        crypto_panic_api.lastPage({ filter: 'hot' })
            .then(results => {
                var filtered_feeds = results.filter(res => new Date(res.created_at).getTime() > threshold_date.getTime());
                var sorted_feeds = _.orderBy(filtered_feeds, (ff) => ff.created_at, 'asc');

                sorted_feeds.map(selected_feed => {
                    //check if the news is duplicate or old
                    if (last_sent_feeds.filter(lsf => lsf.id == selected_feed.id || lsf.created_at > selected_feed.created_at).length <= 0) {
                        console.log(selected_feed)
                        last_sent_feeds.push(selected_feed);
                        if (last_sent_feeds.length > 10)
                            last_sent_feeds = last_sent_feeds.splice(1);

                        dispatcher.dispatch(selected_feed, 99);
                        //send feed
                    }
                })
            })
            .catch(reason => console.log(reason))
    }, 30 * 60 * 1000),
    getFeedRange: (limitDate) => {

        if (!limitDate) {

            limitDate = new Date()
            limitDate.setDate(limitDate.getDate() - 1)
            limitDate.setUTCHours(0, 0, 0, 0)
        }

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
    }
}


exports.feedManager = feedManager;