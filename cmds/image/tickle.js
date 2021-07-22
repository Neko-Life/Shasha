'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend } = require("../../resources/functions");
const interactEmbed = require("./rsc/interactEmbed");

module.exports = class tickle extends commando.Command {
    constructor(client) {
        super(client, {
            name: "tickle",
            memberName: "tickle",
            group: "image",
            description: "Tickle everyone!",
            guildOnly: true
        });
    }
    async run(msg, arg) {
        return trySend(this.client, msg, await interactEmbed(msg, arg, "tickle", ""));
    }
};