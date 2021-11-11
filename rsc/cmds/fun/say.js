'use strict';

const { CommandInteraction, GuildChannel } = require("discord.js");
const { Command } = require("../../classes/Command");
const { getChannelMessage } = require("../../functions");

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
     * @property {string} message
     * 
     * @param {CommandInteraction} inter 
     * @param {runArgs} param1 
     * @returns 
     */
    async run(inter, { text, channel, message }) {
        if (!(text || message)) return inter.reply("Tell me what to say <:bruhLife:798789686242967554>");
        await inter.deferReply();
        if (!text && message) text = {
            value: (await this.getChannelMessage(message.value))?.content
        }
        if (!text.value) return inter.editReply("Nothin found :/");
        if (channel && (
            !channel.channel.isText()
            || !channel.channel.permissionsFor(this.user).has("SEND_MESSAGES")
            || !channel.channel.permissionsFor(this.client.user).has("SEND_MESSAGES")
        )) return inter.editReply("Can't send message to **<#" + channel.channel.id + ">**");

        /**
         * @type {import("discord.js").MessageOptions}
         */
        const send = {
            content: this.client.finalizeStr(text.value, this.isAdmin(true)),
            allowedMentions: this.allowMention(text.value)
        };
        let ret;
        if (channel) {
            ret = await channel.channel.send(send);
            inter.editReply("Said 🙏");
        } else inter.editReply(send);
        return ret;
    }
}