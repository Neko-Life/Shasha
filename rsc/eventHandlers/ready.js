'use strict';

const configFile = require("../../config.json");

async function handle(client) {
    console.log(client.user.tag + ' logged in!');
    client.owners = [];
    for (const U of configFile.owners) {
        const owner = await client.users.fetch(U).catch(() => console.error("Can't fetch owner", U));
        if (owner) client.owners.push(owner);
    }
    // init(client);
}

module.exports = { handle }