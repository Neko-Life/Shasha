"use strict";

const { guildLog } = require("../../config.json");

async function handle(client, guild) {
    if (!client.guildLog && guildLog)
        client.guildLog = await client.channels.fetch(guildLog);
    if (client.guildLog)
        client.guildLog.send(`Left \`${guild.name}\` <:WhenLife:773061840351657984> I'm in ${client.guilds.cache.size} servers now`)
}

module.exports = { handle }
