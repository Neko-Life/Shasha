'use strict';

const { CommandInteraction, Channel } = require("discord.js");
const { Command } = require("../../classes/Command");

module.exports = class SayCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "say"
        });
    }

    /**
     * @typedef {object} runArgs
     * @property {string} text
     * @property {Channel} channel
     * 
     * @param {CommandInteraction} inter 
     * @param {runArgs} param1 
     * @returns 
     */
    async run(inter, { text, channel }) {
        if (channel && !channel.isText()) return inter.reply("Not a text based channel!");
        /**
         * @type {import("discord.js").MessageOptions}
         */
        const send = { content: text.value, allowedMentions: {} };
        // if (inter.member) binds(inter.member, "GUILD_MEMBER");
        if (!inter.member.permissions.has("MENTION_EVERYONE")) {
            if (text.value.match(/<@\!?[^&]\d{17,19}>/g)?.length > 1)
                send.allowedMentions.parse = [];
            else send.allowedMentions.parse = ["users"];
        } else send.allowedMentions.parse = ["everyone", "roles", "users"];
        let ret;
        if (channel) {
            ret = await channel.send(send);
            inter.reply("Sent.");
        } else inter.reply(send);
        return ret;
    }
}