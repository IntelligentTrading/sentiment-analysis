var rp = require('request-promise')
var request = require('request');
var moq = require('../data/moq');
var _ = require('lodash');

var CRYPTO_PANIC_TOKEN = process.env.CRYPTO_PANIC_API_KEY;
var url = `https://cryptopanic.com/api/posts/?auth_token=${CRYPTO_PANIC_TOKEN}`;

/**
 * The CryptoPanic API object 
 */
var cryptoPanic = {
    /**
     * @param {object} filters Add filters such as "filter=trending" or "currencies=ETH"
     * @param {int} pages the number of pages to fetch
     */
    all: (filters, limitDate) => {
        var filters_string = "";

        if (filters) {
            Object.keys(filters).forEach(filter => {
                if (filters[filter]) {
                    filters_string += `&${filter}=${filters[filter]}`;
                }
            })
        }
        return multiplePagesRequest(`${url}${filters_string}`, limitDate);
    },
    lastPage: (filters) => {
        var filters_string = "";

        if (filters) {
            Object.keys(filters).forEach(filter => {
                if (filters[filter]) {
                    filters_string += `&${filter}=${filters[filter]}`;
                }
            })
        }
        return rp(`${url}${filters_string}`)
            .then(jsonResult => {
                var resultObj = JSON.parse(jsonResult);
                var results = resultObj.results;
                return results
            })
    }
}

/**
 * 
 * @param {string} request_url The CryptoPanic endpoint for the request
 */
var cryptoRequestSync = (request_url) => {
    return rp(request_url)
}

/**
 * Retrieves CryptoPanic feed asynchronously back to limitDate
 * @param limitDate the last date allowed for created_at
 */
var multiplePagesRequest = (request_url, limitDate) => new Promise((resolve, reject) => {

    var cumulative_results = [];

    var timed_request = null;
    var next_page_url = request_url;

    timed_request = setInterval(async () => {
        try {
            if (next_page_url) {
                console.log(`DEBUG: Sending request to ${next_page_url}`)
                var jsonResult = await cryptoRequestSync(next_page_url);
                var resultObj = JSON.parse(jsonResult);
                var results = resultObj.results;

                var allowed_results = results.filter(res => {
                    var feed_date_object = new Date(res.created_at);
                    return feed_date_object >= limitDate
                })

                var too_old_results = results.filter(res => {
                    var feed_date_object = new Date(res.created_at);
                    return feed_date_object < limitDate
                })

                cumulative_results.push(allowed_results);

                if (too_old_results.length > 0)
                    next_page_url = null;
                else
                    next_page_url = resultObj.next;
            }
            else {
                clearInterval(timed_request);
                resolve(_.flattenDeep(cumulative_results));
            }
        }
        catch (err) {
            console.log(err);
        }
    }, 3000)
})

exports.cryptoPanic = cryptoPanic
