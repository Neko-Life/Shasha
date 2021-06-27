'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend, defaultImageEmbed } = require("../../resources/functions");
const { default: fetchNeko } = require("nekos-best.js");

module.exports = class dance extends commando.Command {
    constructor(client) {
        super(client, {
            name: "dance",
            memberName: "dance",
            group: "image",
            description: "Let's dance =]"
        });
    }
    async run(msg) {
        const title = `${msg.guild ? msg.member.displayName : msg.author.username} is dancin :>`;
        const image = await fetchNeko("dance");
        const emb = defaultImageEmbed(msg, image, title);
        return trySend(this.client, msg, emb);
    }
};