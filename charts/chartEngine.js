var plotly = require('plotly')('Brbb', process.env.PLOTLY_API_KEY);

var fs = require('fs');

var engine = {
    savePng: (trace) => {

        var imgOpts = {
            format: 'png',
            width: 1000,
            height: 500
        };

        var trace1 = {
            x: ["giraffes", "orangutans", "monkeys"],
            y: [20, 14, 23],
            name: "SF Zoo",
            type: "bar"
        };
        var trace2 = {
            x: ["giraffes", "orangutans", "monkeys"],
            y: [12, 18, 29],
            name: "LA Zoo",
            type: "bar"
        };

        var figure = { 'data': [trace1, trace2], 'layout': { barmode: "stack" } };

        plotly.getImage(figure, imgOpts, function (error, imageStream) {
            if (error) return console.log(error);

            var fileStream = fs.createWriteStream('1.png');
            imageStream.pipe(fileStream);
        });
    }
}

exports.engine = engine;