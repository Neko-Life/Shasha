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
        const aut = msg.guild ? msg.guild.member(msg.author) : msg.author;
        const title = `${msg.guild ? aut.displayName : aut.username}! ~Nyann~ (UwU) <3`;
        const image = `https://nekos.best/nekos/${String(Math.floor(Math.random() * 314)).padStart(4, '0')}.png`;
        const emb = await defaultImageEmbed(this.client, msg, aut, image, title);
        trySend(this.client, msg, emb);
        return ranLog(msg, "neko");
    }
};