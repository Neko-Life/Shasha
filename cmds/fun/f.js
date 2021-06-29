'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend } = require("../../resources/functions");

module.exports = class f extends commando.Command {
    constructor(client) {
        super(client, {
            name: "f",
            memberName: "f",
            group: "fun",
            description: "description"
        });
    }
    async run(msg, arg) {
        if (!msg.author.dbLoaded) await msg.author.dbLoad();
        if (arg) {
            msg.author.F = arg;
            await msg.author.setF(arg)
        };
        return trySend(msg.client, msg,
            msg.author.F + msg.author.F + msg.author.F + "\n" +
            msg.author.F + "\n" +
            msg.author.F + msg.author.F + msg.author.F + "\n" +
            msg.author.F + "\n" +
            msg.author.F);
    }
};