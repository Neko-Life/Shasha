'use strict';

const { guildLog } = require("../../config.json");

// const { join } = require("path");
// const { Worker } = require("worker_threads");
// const { logDev } = require("../debug");

/**
 * 
 * @param {*} client 
 * @param {import("../typins").ShaGuild} guild 
 */
async function handle(client, guild) {
    if (!client.guildLog && guildLog)
        client.guildLog = await client.channels.fetch(guildLog);
    if (client.guildLog)
        client.guildLog.send(`Joined \`${guild.name}\` <:awamazedLife:795227334339985418> I'm in ${client.guilds.cache.size} servers now`)
    // const worker = new Worker(join(__dirname, "../../registerCommands.js"), {
    //     argv: ["null", guild.id]
    // });Joined **${newShaGuild.name}** <:awamazedLife:795227334339985418> I'm in ${shaGuild.length} servers now
    // logDev("Registering commands in", guild.name, guild.id);
    // worker.on("message", logDev);
}

module.exports = { handle }