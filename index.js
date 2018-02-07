var express = require('express');
var app = express();
var feedManager = require('./core/feedAnalysisManager').feedManager;
var feedsMath = require('./core/math').feedsMath;
var chartEngine = require('./charts/chartEngine').engine;
var fs = require('fs');

app.set('port', (process.env.PORT || 5003));

app.get('/', function (request, response) {
    response.sendStatus(200);
});

app.listen(app.get('port'), function () {
    console.log('INFO: Crowd Sentiment Analysis Service starting');
    feedManager.latestFeed();
    /*feedManager.getFeedAnalysisPerDays(2).then(feedAnalysis => {
        chartEngine.buildCrowdSentimentChart(feedAnalysis,'SA');
        fs.exists('SA')
    })*/
});