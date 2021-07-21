'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend } = require("../../resources/functions");
const interactEmbed = require("./rsc/interactEmbed");

module.exports = class hug extends commando.Command {
    constructor(client) {
        super(client, {
            name: "hug",
            memberName: "hug",
            group: "image",
            description: "Hug everyone!",
            guildOnly: true
        });
    }
    async run(msg, arg) {
        return trySend(this.client, msg, await interactEmbed(msg, arg, "hug", "<3"));
    }
};