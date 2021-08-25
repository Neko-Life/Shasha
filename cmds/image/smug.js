'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend, defaultImageEmbed } = require("../../resources/functions");
const { fetchNeko } = require("nekos-best.js");

module.exports = class smug extends commando.Command {
    constructor(client) {
        super(client, {
            name: "smug",
            memberName: "smug",
            group: "image",
            description: "Show your smug"
        });
    }
    async run(msg) {
        msg.channel.startTyping();
        const title = `${msg.guild ? msg.member.displayName : msg.author.username} got a smug face`;
        const image = await fetchNeko("smug");
        const emb = defaultImageEmbed(msg, image.url); emb.setAuthor(title, msg.author.displayAvatarURL({ size: 128, format: "png", dynamic: true }));
        return trySend(this.client, msg, emb);
    }
};