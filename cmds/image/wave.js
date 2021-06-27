'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend } = require("../../resources/functions");
const interactEmbed = require("./interactEmbed");

module.exports = class wave extends commando.Command {
    constructor(client) {
        super(client, {
            name: "wave",
            memberName: "wave",
            group: "image",
            description: "Wave everyone!",
            guildOnly: true
        });
    }
    async run(msg, arg) {
        return trySend(this.client, msg, await interactEmbed(msg, arg, "wave", ":D"));
    }
};