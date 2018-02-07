const webservices = require('./webservices').api;
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });
const _ = require('lodash');
const markdown_opts = {
    parse_mode: "Markdown"
}

var dispatcher = {
    dispatch: (feed, plan = 0) => {

        var keyboard_options = {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: vote_keyboard(feed)
            },
            disable_web_page_preview: true
        };

        webservices.saveFeed(feed).then(() => {

            console.log(`Dispatching crowd analysis feed #${feed.id}`);

            webservices.users()
                .then(jsonUsers => {
                    var users = JSON.parse(jsonUsers).filter(user => user.eula == true && user.settings.subscription_plan >= plan)

                    if (users)
                        users.map(user => bot.sendMessage(user.telegram_chat_id, template(feed), keyboard_options))
                })
        }).catch(reason => console.log(reason))
    }
}

var template = (feed) => {
    return `*Crowd Sentiment*\n${feed.title}\n[Read on CryptoPanic](${feed.url})\n\n${feed.currencies ? _.join(feed.currencies.map(c => `#${c.code}`), ' ') : ''}\n\n${feed.votes.positive} ⇧   ${feed.votes.negative} ⇩   ${feed.votes.important}‼`
}

var vote_keyboard = (feed) => {
    var keyboard = [];
    keyboard.push([
        { text: `⇧ Bullish`, callback_data: `panic.DB:BULL_${feed.id}` },
        { text: `⇩ Bearish`, callback_data: `panic.DB:BEAR_${feed.id}` },
        { text: `!! Important`, callback_data: `panic.DB:IMP_${feed.id}` }])

    return keyboard;
}


exports.dispatcher = dispatcher;