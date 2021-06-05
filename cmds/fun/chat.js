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
    async run(msg) {
        return msg.channel.startTyping().then(
            trySend(this.client, msg, await chatAnswer(msg.cleanContent.slice((msg.guild.commandPrefix + msg.command.name).length + 1))).then(r => {
                msg.channel.stopTyping();
                return r;
            }).catch(
                msg.channel.stopTyping()
            )
        );
    }
};