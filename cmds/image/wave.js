'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend, defaultImageEmbed } = require("../../resources/functions");
const { default: fetchNeko } = require("nekos-best.js");

module.exports = class wave extends commando.Command {
    constructor(client) {
        super(client, {
            name: "wave",
            memberName: "wave",
            group: "image",
            description: "Wave to you friends!"
        });
    }
    async run(msg) {
        msg.channel.startTyping();
        const title = `${msg.guild ? msg.member.displayName : msg.author.username} is waving :)`;
        const image = await fetchNeko("wave");
        const emb = defaultImageEmbed(msg, image, title);
        return trySend(this.client, msg, emb);
    }
};