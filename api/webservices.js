var node_svc_api = `${process.env.ITT_NODE_SERVICES}/api`;
var node_svc_api_key = process.env.NODE_SVC_API_KEY;
const rp = require('request-promise');


function Options() {
    return {
        headers: {
            'NSVC-API-KEY': node_svc_api_key
        }
    }
}

var api = {
    users: (options = {}) => {
        var chat_id = options.telegram_chat_id == undefined ? '' : options.telegram_chat_id;
        var filters = chat_id != '' ? [] : options.filters; //filters won't work for single user selection 

        var stringified_filters = filters ? filters.join('&') : '';

        var request_opts = new Options();
        request_opts.uri = `${node_svc_api}/users/${chat_id}?${stringified_filters}`;
        return rp(request_opts);
    },
    saveFeed: (feed) => {
        var request_opts = {
            uri: `${node_svc_api}/panic`,
            method: 'POST',
            body: {
                feedId: feed.id,
                votes: feed.votes,
                news: feed.title,
                timestamp: feed.created_at,
                url: feed.url
            },
            json: true,
            headers: {
                'NSVC-API-KEY': process.env.NODE_SVC_API_KEY
            }
        };
        return rp(request_opts);
    }
}

exports.api = api;