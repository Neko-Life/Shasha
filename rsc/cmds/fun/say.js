'use strict';

const { CommandInteraction, GuildChannel } = require("discord.js");
const { Command } = require("../../classes/Command");
const { isAdmin, allowMention } = require("../../functions");

module.exports = class SayCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "say"
        });
    }

    /**
     * @typedef {object} runArgs
     * @property {string} text
     * @property {{channel: GuildChannel}} channel
     * 
     * @param {CommandInteraction} inter 
     * @param {runArgs} param1 
     * @returns 
     */
    async run(inter, { text, channel }) {
        if (channel && (!channel.channel.isText() || !channel.channel.permissionsFor(inter.client.user).has("SEND_MESSAGES")))
            return inter.reply("Can't send message to **<#" + channel.channel.id + ">**");
        /**
         * @type {import("discord.js").MessageOptions}
         */
        const send = {
            content: inter.client.finalizeStr(text.value, isAdmin(inter.member || inter.user)),
            allowedMentions: allowMention({ member: inter.member, content: text.value })
        };
        let ret;
        if (channel) {
            ret = await channel.channel.send(send);
            inter.reply("Said 🙏");
        } else inter.reply(send);
        return ret;
    }
}