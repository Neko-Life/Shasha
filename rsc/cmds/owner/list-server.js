'use strict';

const { MessageEmbed, User } = require("discord.js");
const { Command } = require("../../classes/Command");
const { prevNextButton } = require("../../functions");

module.exports = class ListServerCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "listserver",
            ownerOnly: true
        });
    }
    async run(inter, mutual) {
        const guilds = (mutual instanceof User ? this.client.findMutualGuilds(mutual) : this.client.guilds.cache).map(r => r);
        guilds.sort((a, b) => b.me.joinedTimestamp - a.me.joinedTimestamp);
        const pages = [];
        const button = prevNextButton(true);
        let emb = new MessageEmbed();
        let desc = "";
        let count = 0;
        for (let i = 0; i < guilds.length; i++) {
            const add = `\`${++count}\`: ${guilds[i].name} (${guilds[i].memberCount}) - ${guilds[i].id}\n`;
            if ((desc + add).length > 4000 || !guilds[i + 1]) {
                emb.setDescription(desc + add);
                pages.push({
                    content: `${guilds.length} servers, ${this.client.channels.cache.size} channels and ${this.client.users.cache.size} users total`,
                    embeds: [emb], components: [button]
                });
                emb = new MessageEmbed();
                desc = "";
            } else desc += add;
        }
        const mes = await inter.reply({ ...pages[0], fetchReply: true });
        this.client.createMessageInteraction(mes.id, { CURRENT_PAGE: 0, PAGES: pages });
        return mes;
    }
}