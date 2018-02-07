var plotly = require('plotly')('Brbb', process.env.PLOTLY_API_KEY);
var feedsUtil = require('../core/math').feedsMath;

var fs = require('fs');

var engine = {
    savePng: (traces, layout = {}, name = new Date()) => {

        var imgOpts = {
            format: 'png',
            width: 1000,
            height: 500,
            title: 'TEST'
        };

        var figure = { 'data': traces, 'layout': layout };

        plotly.getImage(figure, imgOpts, function (error, imageStream) {
            if (error) return console.log(error);

            var fileStream = fs.createWriteStream(`${name}.png`);
            imageStream.pipe(fileStream);
        });
    },
    /**
     * @param feedAnalysis The result of the feed analysis from {@link core.feedManager()}
     * @param date The day to filter for the trace
     */
    getTrace: (feedAnalysis, date) => {
        var dateISO = ISOSmallDate(date);
        var dateFeeds = feedAnalysis.filter(elements => elements.key.split('#')[1] == dateISO && elements.key.split('#')[0] != 'Generic')
        var dateSortedFields = feedsUtil.sortFeedsByPositive(dateFeeds);
        return [{
            y: dateSortedFields.map(sf => sf.key.split('#')[0]),
            x: dateSortedFields.map(sf => sf.positive),
            type: "bar",
            name: `#Postive`,
            orientation: 'h',
            marker: { color: "#8AB6B6" },
        },
        {
            y: dateSortedFields.map(sf => sf.key.split('#')[0]),
            x: dateSortedFields.map(sf => sf.negative),
            type: "bar",
            name: `#Negative`,
            orientation: 'h',
            marker: { color: "#E79E8E" },
        },
        {
            y: dateSortedFields.map(sf => sf.key.split('#')[0]),
            x: dateSortedFields.map(sf => sf.important),
            type: "bar",
            name: `#Important`,
            orientation: 'h',
            marker: { color: "#FFFF00" },
        }]
    },
    buildCrowdSentimentChart: (feedAnalysis, name) => {

        var today = new Date();
        var yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        var todayTrace = engine.getTrace(feedAnalysis, today);
        var yesterdayTrace = engine.getTrace(feedAnalysis, yesterday);
        todayTrace.map(t => { t.xaxis = "x2"; t.yaxis = "y2"; t.showlegend = false })

        var totalTraces = yesterdayTrace.concat(todayTrace)

        engine.savePng(totalTraces, {
            images: [
                {
                    xref: "x",
                    yref: "y",
                    x: 1,
                    y: 1.5,
                    sizex: 0.2,
                    sizey: 0.2,
                    xanchor: "right",
                    yanchor: "bottom",
                    source: "http://files.coinmarketcap.com.s3-website-us-east-1.amazonaws.com/static/img/coins/200x200/intelligent-trading-tech.png",
                }
            ],
            barmode: "stack",
            title: "Crowd Sentiment <br> <i>Daily newsfeed reactions comparison, sorted by most positive</i>",
            xaxis: {
                title: `${ISOSmallDate(yesterday)} Reactions`,
                domain: [0, 0.45]
            },
            yaxis2: { anchor: "x2" },
            xaxis2: {
                title: `${ISOSmallDate(today)} Reactions`,
                domain: [0.55, 1]
            },
        },
            `${name}#${ISOSmallDate(today)}`)
    }
}

function ISOSmallDate(date) {
    return date.toISOString().split('T')[0]
}

exports.engine = engine;