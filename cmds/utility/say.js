'use strict';

const commando = require("@iceprod/discord.js-commando");
const emoteMessage = require("../../resources/emoteMessage");
const { ranLog, trySend, tryDelete } = require("../../resources/functions");

module.exports = class say extends commando.Command {
    constructor(client) {
        super(client, {
            name: "say",
            memberName: "say",
            group: "utility",
            description: "Say."
        });
    }
    run(msg, args) {
        let noArgs = `<@!${msg.author.id}> what to say?`;
        if (!args) {
            args = noArgs;
        }
        args = emoteMessage(this.client, args);
        const sendThis = {content:args, disableMentions:"all"};
        if (msg.member?.hasPermission("ADMINISTRATOR")) {
          sendThis.disableMentions = "none";
        }
        trySend(this.client, msg, sendThis);
        if (args !== noArgs && msg.channel.guild && msg.member.hasPermission("MANAGE_MESSAGES")) {
            tryDelete(msg);
        }
        return ranLog(msg,'say',`Content: ${args}`);
    }
};