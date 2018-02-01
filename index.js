var express = require('express');
var app = express();
var feedManager = require('./core/feed').feedManager;
var chartEngine = require('./charts/chartEngine').engine;

app.set('port', (process.env.PORT || 5003));

app.get('/', function (request, response) {
    response.sendStatus(200);
});

app.listen(app.get('port'), function () {
    console.log('INFO: Crowd Sentiment Analysis Service starting');
    feedManager.latestFeed();
    //feedManager.getFeedRange(1);
    /*chartEngine.savePng({
        x: [1, 2, 3, 4],
        y: [10, 15, 13, 17],
        type: "scatter"
    })*/
});