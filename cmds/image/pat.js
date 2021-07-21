'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend } = require("../../resources/functions");
const interactEmbed = require("./rsc/interactEmbed");

module.exports = class pat extends commando.Command {
    constructor(client) {
        super(client, {
            name: "pat",
            memberName: "pat",
            group: "image",
            description: "Pat everyone!",
            guildOnly: true
        });
    }
    async run(msg, arg ) {
        return trySend(this.client, msg, await interactEmbed(msg, arg, "pat", "UwU"));
    }
};