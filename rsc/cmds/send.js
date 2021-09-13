'use strict';

const { CommandInteraction, GuildChannel } = require("discord.js");
const { Command } = require("../classes/Command");
const emoteMessage = require("../emoteMessage");
const { isAdmin, adCheck } = require("../functions");

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
            return inter.reply("Can't send message to that channel!");
        const use = emoteMessage(inter.client, text.value);
        /**
         * @type {import("discord.js").MessageOptions}
         */
        const send = {
            content: isAdmin(inter.member || inter.user)
                ? use
                : adCheck(use),
            allowedMentions: {}
        };
        // if (inter.member) binds(inter.member, "GUILD_MEMBER");
        if (!inter.member.permissions.has("MENTION_EVERYONE")) {
            if (text.value.match(/<@\!?[^&]\d{17,19}>/g)?.length > 1)
                send.allowedMentions.parse = [];
            else send.allowedMentions.parse = ["users"];
        } else send.allowedMentions.parse = ["everyone", "roles", "users"];
        let ret;
        if (channel) {
            ret = await channel.channel.send(send);
            inter.reply("Sent 🙏");
        } else inter.reply(send);
        return ret;
    }
}