'use strict';

const configFile = require("../../config.json");

module.exports = {
    description: "Retry login",
    aliases: ["re"],
    run(client) {
        return client.login(configFile.token).catch(console.error);
    }
}