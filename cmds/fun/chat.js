'use strict';

const commando = require("@iceprod/discord.js-commando");
const { chatAnswer } = require("../../resources/shaChat");

module.exports = class chat extends commando.Command {
    constructor(client) {
        super(client, {
            name: "chat",
            memberName: "chat",
            group: "fun",
            description: "Lets chat!"
        });
    }
    async run(msg, args) {
        if (!args) {
            return trySend(msg.client, msg, "Ask me somethin?");
        }
        msg.channel.startTyping();
        return trySend(this.client, msg, await chatAnswer(
            msg.cleanContent.slice((msg.guild.commandPrefix + msg.alias).length + 1).trim()));
    }
};