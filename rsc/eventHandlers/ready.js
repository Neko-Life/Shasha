'use strict';

const configFile = require("../../config.json");
const ShaClient = require("../classes/ShaClient");
const { logDev } = require("../debug");

/**
 * 
 * @param {ShaClient} client 
 */
async function handle(client) {
    if (configFile.errLogChannel)
        client.errorChannel = await client.channels.fetch(configFile.errLogChannel)
            .catch((e) => {
                logDev(e);
                console.error("Can't fetch error log channel", configFile.errLogChannel);
            });
    for (const U of configFile.owners) {
        const owner = await client.users.fetch(U)
            .catch((e) => {
                logDev(e);
                console.error("Can't fetch owner", U);
            });
        if (owner) client.owners.push(owner);
    }
    // init(client);
    console.log(client.user.tag + ` logged in ${client.guilds.cache.size} guilds`);
}

module.exports = { handle }