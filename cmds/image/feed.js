'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend } = require("../../resources/functions");
const interactEmbed = require("./rsc/interactEmbed");

module.exports = class feed extends commando.Command {
    constructor(client) {
        super(client, {
            name: "feed",
            memberName: "feed",
            group: "image",
            description: "Feed everyone!",
            guildOnly: true
        });
    }
    async run(msg, arg) {
        return trySend(this.client, msg, await interactEmbed(msg, arg, "feed", ""));
    }
};