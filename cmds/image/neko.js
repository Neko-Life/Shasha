'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend, defaultImageEmbed } = require("../../resources/functions");
const { default: fetchNeko } = require("nekos-best.js");

module.exports = class neko extends commando.Command {
    constructor(client) {
        super(client, {
            name: "neko",
            memberName: "neko",
            group: "image",
            description: "Neko."
        });
    }
    async run(msg) {
        const title = `${msg.guild ? msg.member.displayName : msg.author.username} ~Nyann~ (UwU) <3`;
        const image = await fetchNeko("nekos");
        const emb = defaultImageEmbed(msg, image, title);
        return trySend(this.client, msg, emb);
    }
};