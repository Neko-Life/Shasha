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
        if (!msg.author.DB) await msg.author.dbLoad();
        if (arg) {
            msg.author.DB.F = arg;
            await msg.author.setF(arg)
        };
        return trySend(msg.client, msg,
            msg.author.DB.F + msg.author.DB.F + msg.author.DB.F + "\n" +
            msg.author.DB.F + "\n" +
            msg.author.DB.F + msg.author.DB.F + msg.author.DB.F + "\n" +
            msg.author.DB.F + "\n" +
            msg.author.DB.F);
    }
};