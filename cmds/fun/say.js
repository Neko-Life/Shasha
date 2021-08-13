'use strict';

const { CommandInteraction } = require("discord.js");
const { Command } = require("../../rsc/classes/Command");
// const { binds } = require("../../rsc/structures");

// const emoteMessage = require("../../resources/emoteMessage");
// const { ranLog, trySend, tryDelete, getChannelMessage } = require("../../resources/functions");
const a = {
    run: async (cmd) => {
        // const REPLACE = args.match(/(?<!\\)--m +[^\s\n]+( +\d{17,19})?/g);
        // if (REPLACE?.length)
        //     for (const RE of REPLACE) {
        //         const tar = RE.split(/ +/);
        //         const tarMes = await getChannelMessage(msg, tar[1], tar[2]);
        //         const reg = new RegExp(RE + "(\\s(?=\\W))?");
        //         args = args.replace(reg, tarMes.content);
        //     };

        if (!args) args = '​';
        // args = emoteMessage(this.client, args);
        const sendThis = { content: args, disableMentions: "all", split: true };
        if (cmd.member?.hasPermission('MENTION_EVERYONE')) {
            sendThis.disableMentions = "none";
        }
        const sent = await trySend(this.client, msg, sendThis);
        if (args != '​' && msg.guild && !(new RegExp("^<@\!?" + msg.client.user.id + ">\s"))
            .test(msg.content) && msg.member.hasPermission("MANAGE_MESSAGES") &&
            msg.guild.member(this.client.user).hasPermission("MANAGE_MESSAGES")) {
            tryDelete(msg);
        }
        ranLog(msg, sent.content);
        return sent;
    }
}

module.exports = class SayCmd extends Command {
    constructor(interaction) {
        super(interaction, { name: "say" });
    }
    /**
     * @param {CommandInteraction} inter
     * @param {string} arg
     */
    async run(inter, arg) {
        /**
         * @type {import("discord.js").MessageOptions}
         */
        const send = { content: arg, allowedMentions: {} };
        // if (inter.member) binds(inter.member, "GUILD_MEMBER");
        if (!inter.member.permissions.has("MENTION_EVERYONE")) {
            send.allowedMentions.parse = ["users"];
        } else send.allowedMentions.parse = ["everyone", "roles", "users"];
        return inter.reply(send);
    }
}