"use strict";

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
        const oldCh = inter.channel;
        let deferred;
        if (!text && message) {
            deferred = true;
            await inter.deferReply();
            text = {
                value: (await this.messageArg(message.value, oldCh))?.content
            }
        }
        if (!text.value) return inter[deferred ? "editReply" : "reply"]("Nothin found :/");
        if (channel && (
            !channel.channel.isText()
            || !channel.channel.permissionsFor(this.user).has("SEND_MESSAGES")
            || !channel.channel.permissionsFor(this.client.user).has("SEND_MESSAGES")
        )) return inter[deferred ? "editReply" : "reply"]("Can't send message to **<#" + channel.channel.id + ">**");

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
            inter[deferred ? "editReply" : "reply"]("Said 🙏");
        } else inter[deferred ? "editReply" : "reply"](send);
        return ret;
    }
}