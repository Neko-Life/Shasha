'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend, defaultImageEmbed } = require("../../resources/functions");
const { default: fetchNeko } = require("nekos-best.js");

module.exports = class laugh extends commando.Command {
    constructor(client) {
        super(client, {
            name: "laugh",
            memberName: "laugh",
            group: "image",
            description: "Show your laugh :D"
        });
    }
    async run(msg) {
        const title = `${msg.guild ? msg.member.displayName : msg.author.username} is laughin XD`;
        const image = await fetchNeko("laugh");
        const emb = defaultImageEmbed(msg, image, title);
        return trySend(this.client, msg, emb);
    }
};