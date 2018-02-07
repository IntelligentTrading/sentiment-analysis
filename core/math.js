var _ = require('lodash');

var feedsMath = {
    /**
     * Returns a grouped array of daily reactions for feeds. The key value is a concatenation of currency#date
     * to perform only one group by.
     * 
     * @param the list of feeds
     * @returns dailyFeedsReactions as grouped feeds with total positive/negative/important per currency/date
     */
    getDailyReactions: (feeds) => {
        var groupedFeeds = _.groupBy(feeds, feed => feed.currency + '#' + feed.date)
        var dailyFeedsReactions = [];

        Object.keys(groupedFeeds).sort('desc').forEach(groupedFeedKey => {
            var dailyFeedReactions = {
                key: groupedFeedKey,
                positive: 0,
                negative: 0,
                important: 0
            };

            groupedFeeds[groupedFeedKey].map(current => {
                dailyFeedReactions.positive += current.positive;
                dailyFeedReactions.negative += current.negative;
                dailyFeedReactions.important += current.important;
            })

            dailyFeedReactions.sentiment = dailyFeedReactions.positive * 100 / (dailyFeedReactions.positive + dailyFeedReactions.negative)
            dailyFeedReactions.reactions = dailyFeedReactions.positive + dailyFeedReactions.negative + dailyFeedReactions.important;

            var historicalDailyFeedsReaction = dailyFeedsReactions.filter(dfr => dfr.key.split('#')[0] == dailyFeedReactions.key.split('#')[0]);
            if (historicalDailyFeedsReaction.length > 0) {
                dailyFeedReactions.historicalSentiment = _.last(historicalDailyFeedsReaction).sentiment;
                dailyFeedReactions.historicalReactions = _.last(historicalDailyFeedsReaction).reactions;
                dailyFeedReactions.sentimentChange = (dailyFeedReactions.sentiment - dailyFeedReactions.historicalSentiment) / dailyFeedReactions.historicalSentiment * 100
                dailyFeedReactions.reactionsChange = (dailyFeedReactions.reactions - dailyFeedReactions.historicalReactions) / dailyFeedReactions.historicalReactions * 100
            }

            dailyFeedsReactions.push(dailyFeedReactions);
        })

        return dailyFeedsReactions;
    },
    sortFeedsByPositive: (dailyFeedsReactions) => {
        return dailyFeedsReactions.sort((a, b) => a.positive > b.positive)
    },
    sortFeedsBySentiment: (dailyFeedsReactions) => {
        return dailyFeedsReactions.sort((a, b) => a.sentiment < b.sentiment)
    },
    sortFeedsByReactionsVolume: (dailyFeedsReactions) => {
        return dailyFeedsReactions.sort((a, b) => a.reactions < b.reactions)
    }
}

exports.feedsMath = feedsMath;