'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend, ranLog, defaultImageEmbed } = require("../../resources/functions");

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
        const title = `${msg.guild ? msg.member.displayName : msg.author.username}! ~Nyann~ (UwU) <3`;
        const image = `https://nekos.best/nekos/${String(Math.floor(Math.random() * 314)).padStart(4, '0')}.png`;
        const emb = await defaultImageEmbed(msg, image, title);
        return trySend(this.client, msg, emb);
    }
};