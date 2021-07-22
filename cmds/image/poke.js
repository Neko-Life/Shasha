'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend } = require("../../resources/functions");
const interactEmbed = require("./rsc/interactEmbed");

module.exports = class poke extends commando.Command {
    constructor(client) {
        super(client, {
            name: "poke",
            memberName: "poke",
            group: "image",
            description: "Poke everyone!",
            guildOnly: true
        });
    }
    async run(msg, arg) {
        return trySend(this.client, msg, await interactEmbed(msg, arg, "poke", ""));
    }
};