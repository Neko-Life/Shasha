"use strict";

const configFile = require("../../config.json");
const ShaClient = require("../classes/ShaClient");
const { logDev } = require("../debug");
const { emitShaError } = require("../functions");

/**
 * 
 * @param {ShaClient} client 
 */
async function handle(client) {
    client.application.commands.fetch().catch((e) => {
        emitShaError(e);
        console.error("Can't fetch application commands");
    });
    if (configFile.errLogChannel)
        client.errorChannel = await client.channels.fetch(configFile.errLogChannel)
            .then(r => { r.send("I'm online"); return r; })
            .catch((e) => {
                emitShaError(e);
                console.error("Can't fetch error log channel", configFile.errLogChannel);
            });
    for (const U of configFile.owners) {
        const owner = await client.users.fetch(U)
            .catch((e) => {
                emitShaError(e);
                console.error("Can't fetch owner", U);
            });
        if (owner) client.owners.push(owner);
    }
    await client.loadScheduler();
    // init(client);
    console.log(client.user.tag + ` logged in ${client.guilds.cache.size} guilds`);
    const fRC = process.argv.find(r => r.startsWith("rbc="));
    if (fRC?.length) {
        console.log("Rebooted at", Date().toString());
        const id = fRC.match(/\d{17,20}/);
        const channel = client.channels.resolve(id) || await client.channels.fetch(id).catch(logDev);
        if (channel) channel.send("Rebooted successfully!");
    }
}

module.exports = { handle }
