'use strict';

const configFile = require("../../config.json");
const ShaClient = require("../classes/ShaClient");

/**
 * 
 * @param {ShaClient} client 
 */
async function handle(client) {
    if (configFile.errLogChannel)
        client.errorChannel = await client.channels.fetch(configFile.errLogChannel)
            .catch(console.error);
    for (const U of configFile.owners) {
        const owner = await client.users.fetch(U).catch(() => console.error("Can't fetch owner", U));
        if (owner) client.owners.push(owner);
    }
    // init(client);
    console.log(client.user.tag + ' logged in!');
}

module.exports = { handle }