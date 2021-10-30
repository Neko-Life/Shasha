'use strict';

// ---------------- CONSTANTS ----------------

const randomColors = [
    12357519,
    16711935,
    128,
    32896,
    15277667,
    "00ff00",
    "ff0000",
    "ff94f2",
    "f1e40f",
    "ff8c00",
    "a0522d",
    3447003,
    "0fffff",
    "803c9d",
    "faa775",
    "000000",
    16777214
];

const ePerms = [
    "KICK_MEMBERS",
    "BAN_MEMBERS",
    "MANAGE_CHANNELS",
    "MANAGE_GUILD",
    "VIEW_AUDIT_LOG",
    "MANAGE_MESSAGES",
    "MENTION_EVERYONE",
    "VIEW_GUILD_INSIGHTS",
    "MUTE_MEMBERS",
    "DEAFEN_MEMBERS",
    "MOVE_MEMBERS",
    "MANAGE_NICKNAMES",
    "MANAGE_ROLES",
    "MANAGE_WEBHOOKS",
    "MANAGE_EMOJIS_AND_STICKERS",
    "MANAGE_THREADS"
];

const reValidURL = /^https?:\/\/[^\s\n]+\.[^\s\n][^\s\n]/;
const reParseQuote = /(?<!".+)'.+'(?!.+")|(?<!'.+)".+"(?!.+')/g;

const NSFW_ENDPOINTS = [
    "ass",
    "athighs",
    "blow",
    "boobs",
    "feet",
    "furfuta",
    "furgif",
    "futa",
    "gifs",
    "hboobs",
    "hentai",
    "hfeet",
    "jackopose",
    "milk",
    "pantsu",
    "sex",
    "slime",
    "trap",
    "yuri"
];

const INTERACT_ENDPOINTS = [
    "tickle",
    "kiss",
    "cuddle",
    "feed",
    "hug",
    "pat",
    "poke",
    "bite",
    "slap",
    "highfive",
    "stare",
    "wink"
];

const EXPRESS_ENDPOINTS = [
    "smile",
    "smug",
    "laugh",
    "baka",
    "cry",
    "dance",
    "wave",
    "blush",
    "bored",
    "facepalm",
    "happy",
    "pout",
    "shrug",
    "sleep",
    "think",
    "thumbsup"
];

const INTERACT_TEXTS = {
    "tickle": " tickles ",
    "kiss": " kisses ",
    "cuddle": " cuddles ",
    "feed": " feeds ",
    "hug": " hugs ",
    "pat": " pats ",
    "poke": " pokes ",
    "bite": " bites ",
    "slap": " slaps ",
    "highfive": " highfives ",
    "stare": " stares at ",
    "wink": " winks at "
}

const EXPRESS_TEXTS = {
    "smile": " is smiling",
    "smug": " got a smug face",
    "laugh": " is laughing",
    "baka": " thinks you're a b- baka!",
    "cry": " is crying",
    "dance": " is shaking their booty",
    "wave": " is waving",
    "blush": " is blushing",
    "bored": " is bored",
    "facepalm": " is disappointed",
    "happy": " is happy",
    "pout": " is pouting",
    "shrug": " is not sure",
    "sleep": " is sleepy",
    "think": " is thinking",
    "thumbsup": " agreed"
}

module.exports = {
    randomColors,
    ePerms,
    reValidURL,
    reParseQuote,
    NSFW_ENDPOINTS,
    INTERACT_ENDPOINTS,
    EXPRESS_ENDPOINTS,
    INTERACT_TEXTS,
    EXPRESS_TEXTS
}