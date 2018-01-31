var express = require('express');
var app = express();
var feedManager = require('./core/feed').feedManager;

app.set('port', (process.env.PORT || 5003));

app.get('/', function (request, response) {
    response.sendStatus(200);
});

app.listen(app.get('port'), function () {
    console.log('INFO: Crowd Sentiment Analysis Service starting');
    feedManager.latestFeed();
});