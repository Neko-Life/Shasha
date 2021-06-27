'use strict';

const vina = require("./resources/vina"),
    emoteMessage = require("../emoteMessage");

module.exports = {
    description: "Vina",
    aliases: ["v"],
    run(client, arg) {
        return vina(emoteMessage(client, arg));
    }
}