const webservices = require('./webservices').api;
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });
const _ = require('lodash');
const markdown_opts = {
    parse_mode: "Markdown" 
}

var dispatcher = {
    dispatch: (feed) => {

        var keyboard_options = {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: vote_keyboard(feed)
            }
        };

        webservices.users()
            .then(jsonUsers => {
                var users = JSON.parse(jsonUsers).filter(user => user.eula == true)
                users.map(user => bot.sendMessage(user.telegram_chat_id, template(feed), keyboard_options))
            })
            .catch(reason => console.log(reason))
    }
}

var template = (feed) => {
    return `*Crowd Sentiment Analysis* (by CryptoPanic)\n${feed.title}\n${_.join(feed.currencies.map(c => `#${c.code}`), ' ')}\n\n${feed.votes.positive} ⇧   ${feed.votes.negative} ⇩   ${feed.votes.important}‼`
}

var vote_keyboard = (feed) => {
    var keyboard = [];
    keyboard.push([
        { text: `⇧ Bullish`, callback_data: `SEN_BULL_${feed.id}` },
        { text: `⇩ Bearish`, callback_data: `SEN_BEAR_${feed.id}` },
        { text: `!! Important`, callback_data: `SEN_IMP_${feed.id}` }])

    return keyboard;
}


exports.dispatcher = dispatcher;