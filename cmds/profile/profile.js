'use strict';

const commando = require("@iceprod/discord.js-commando");
const { MessageEmbed } = require("discord.js");
const { errLog, trySend } = require("../../resources/functions");

module.exports = class profile extends commando.Command {
    constructor(client) {
        super(client, {
            name: "profile",
            memberName: "profile",
            group: "profile",
            description: "Show Users/Member profile"
        });
    }
    async run(msg, arg) {
        const args = arg.trim().split(/ +/);
        let Users = [];
        let emb = new MessageEmbed();
        if (!arg) {
            Users.push(msg.author);
        } else {
            for(const userArr of args) {
                let theUser = userArr;
                if (theUser.startsWith("<")) {
                    theUser.slice(2);
                }
                if (theUser.endsWith(">")) {
                    theUser.slice(0,-1);
                } 
                if (theUser.startsWith("!")) {
                    theUser.slice(1);
                }
                if (!/\D/.test(theUser)) {
                    try {
                        Users.push(await this.client.users.fetch(theUser));
                    } catch (e) {
                        errLog(e, msg, this.client, false, `Can't find user \`${userArr}\``);
                    }
                } else {
                    trySend(this.client, msg, `Invalid user provided \`${userArr}\``);
                }
            }
        }
    }
};