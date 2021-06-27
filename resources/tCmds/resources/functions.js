'use strict';

const { cleanMentionID } = require("../../functions");

function findGuild(client, arg) {
    const key = cleanMentionID(arg);
    let guild;
    if (/^\d{17,19}$/.test(key)) {
        guild = client.guilds.cache.get(key);
    }
    if (!guild) {
        guild = client.guilds.cache.map(r => r).filter(r => new RegExp(key, "i").test(r.name));
    }
    return guild;
}

function getGuild(client, arg) {
    return findGuild(client, arg)?.[0];
}

module.exports = { getGuild }