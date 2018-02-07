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
    }
}

exports.feed = feed;