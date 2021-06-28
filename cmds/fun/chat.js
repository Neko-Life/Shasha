'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend } = require("../../resources/functions");
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
        return msg.channel.startTyping()
            .then(
                trySend(this.client, msg, await chatAnswer(
                    msg.cleanContent.slice((msg.guild.commandPrefix + msg.command.name).length).trim()
                )).then(r => r)
            ).catch(() => { })
            .finally(msg.channel.stopTyping());
    }
};