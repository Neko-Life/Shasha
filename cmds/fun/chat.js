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
    async run(msg) {
        chatAnswer(this.client, msg);
    }
};