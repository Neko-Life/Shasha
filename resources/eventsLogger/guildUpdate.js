'use strict';

const { Guild } = require("discord.js");

/**
 * @param {Guild} oldGuild 
 * @param {Guild} newGuild 
 */
module.exports = async (oldGuild, newGuild) => {
    if (!newGuild.DB) await newGuild.dbLoad();
    let audit = (await newGuild.fetchAuditLogs({ "limit": 1, "type": "GUILD_UPDATE" })).entries.first();
    console.log(audit);
}