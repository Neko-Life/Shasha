'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend, defaultImageEmbed } = require("../../resources/functions");
const { fetchNeko } = require("nekos-best.js");

module.exports = class smile extends commando.Command {
    constructor(client) {
        super(client, {
            name: "smile",
            memberName: "smile",
            group: "image",
            description: "Show your smile"
        });
    }
    async run(msg) {
        msg.channel.startTyping();
        const title = `${msg.guild ? msg.member.displayName : msg.author.username} is smilin`;
        const image = await fetchNeko("smile");
        const emb = defaultImageEmbed(msg, image.url); emb.setAuthor(title, msg.author.displayAvatarURL({ size: 128, format: "png", dynamic: true }));
        return trySend(this.client, msg, emb);
    }
};