'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend, defaultImageEmbed } = require("../../resources/functions");
const { fetchNeko } = require("nekos-best.js");

module.exports = class baka extends commando.Command {
    constructor(client) {
        super(client, {
            name: "baka",
            memberName: "baka",
            group: "image",
            description: "Say \"baka\""
        });
    }
    async run(msg) {
        msg.channel.startTyping();
        const title = `${msg.guild ? msg.member.displayName : msg.author.username} is getting dere-dere~`;
        const image = await fetchNeko("baka");
        const emb = defaultImageEmbed(msg, image.url); emb.setAuthor(title, msg.author.displayAvatarURL({ size: 128, format: "png", dynamic: true }));
        return trySend(this.client, msg, emb);
    }
};