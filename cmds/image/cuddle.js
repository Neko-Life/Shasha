'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend } = require("../../resources/functions");
const interactEmbed = require("./rsc/interactEmbed");

module.exports = class cuddle extends commando.Command {
    constructor(client) {
        super(client, {
            name: "cuddle",
            memberName: "cuddle",
            group: "image",
            description: "Cuddle everyone!",
            guildOnly: true
        });
    }
    async run(msg, arg) {
        return trySend(this.client, msg, await interactEmbed(msg, arg, "cuddle", "OwO"));
    }
};