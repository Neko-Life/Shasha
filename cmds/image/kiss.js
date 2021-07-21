'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend } = require("../../resources/functions");
const interactEmbed = require("./rsc/interactEmbed");

module.exports = class kiss extends commando.Command {
    constructor(client) {
        super(client, {
            name: "kiss",
            memberName: "kiss",
            group: "image",
            description: "Kiss everyone!",
            guildOnly: true
        });
    }
    async run(msg, arg) {
        return trySend(this.client, msg, await interactEmbed(msg, arg, "kiss", ">,<"))
    }
};