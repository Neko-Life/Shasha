'use strict';

const commando = require("@iceprod/discord.js-commando");
const emoteMessage = require("../../resources/emoteMessage");
const { ranLog, trySend, tryDelete } = require("../../resources/functions");

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
        if (!args) args = '​';
        args = emoteMessage(this.client, args);
        const sendThis = {content:args, disableMentions:"all"};
        if (msg.member?.hasPermission('MENTION_EVERYONE')) {
          sendThis.disableMentions = "none";
        }
        const sent = await trySend(this.client, msg, sendThis);
        if (args != '​' && msg.channel.guild && msg.member.hasPermission("MANAGE_MESSAGES")) {
            tryDelete(msg);
        }
        ranLog(msg, sent.content);
        return sent;
    }
};