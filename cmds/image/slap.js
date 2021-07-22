'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend } = require("../../resources/functions");
const interactEmbed = require("./rsc/interactEmbed");

module.exports = class slap extends commando.Command {
    constructor(client) {
        super(client, {
            name: "slap",
            memberName: "slap",
            group: "image",
            description: "Slap everyone!",
            guildOnly: true
        });
    }
    async run(msg, arg) {
        return trySend(this.client, msg, await interactEmbed(msg, arg, "slap", ""));
    }
};