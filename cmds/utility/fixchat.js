'use strict';

const commando = require("@iceprod/discord.js-commando"),
{ fixChat } = require("../../resources/shaChat");
const { trySend } = require("../../resources/functions");

module.exports = class fixchat extends commando.Command {
    constructor(client) {
        super(client, {
            name: "fixchat",
            memberName: "fixchat",
            group: "utility",
            description: "Fix broken chat."
        });
    }
    async run(msg) {
        const r;// = await fixChat();
        if (r === 3) {
            return trySend(this.client, msg, "Fixed!");
        } else {
            return trySend(this.client, msg, "Oopsie somethin's wrong...");
        }
    }
};