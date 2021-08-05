'use strict';

const commando = require("@iceprod/discord.js-commando");
const emoteMessage = require("../../resources/emoteMessage");
const { ranLog, trySend, tryDelete, getChannelMessage } = require("../../resources/functions");

module.exports = class say extends commando.Command {
    constructor(client) {
        super(client, {
            name: "say",
            memberName: "say",
            group: "fun",
            description: "Say."
        });
    }
    async run(msg, args) {
        const REPLACE = args.match(/(?<!\\)--m +[^\s\n]+( +\d{17,19})?/g);
        if (REPLACE?.length)
            for (const RE of REPLACE) {
                const tar = RE.split(/ +/);
                const tarMes = await getChannelMessage(msg, tar[1], tar[2]);
                const reg = new RegExp(RE + "(\\s(?=\\W))?");
                args = args.replace(reg, tarMes.content);
            };

        if (!args) args = '​';
        args = emoteMessage(this.client, args);
        const sendThis = { content: args, disableMentions: "all", split: true };
        if (msg.member?.hasPermission('MENTION_EVERYONE')) {
            sendThis.disableMentions = "none";
        }
        const sent = await trySend(this.client, msg, sendThis);
        if (args != '​' && msg.guild && !(new RegExp("^<@\!?" + msg.client.user.id + ">\s")).test(msg.content) && msg.member.hasPermission("MANAGE_MESSAGES") && msg.guild.member(this.client.user).hasPermission("MANAGE_MESSAGES")) {
            tryDelete(msg);
        }
        ranLog(msg, sent.content);
        return sent;
    }
};