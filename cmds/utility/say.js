'use strict';

const commando = require("@iceprod/discord.js-commando");
const { errLog, ranLog, trySend, tryDelete } = require("../../resources/functions");

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
        trySend(this.client, msg, args);
        if (args !== noArgs && msg.channel.guild) {
            tryDelete(msg);
        }
        return ranLog(msg,'say',`Content: ${args}`);
    }
};