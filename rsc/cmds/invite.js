'use strict';

const { Command } = require("../classes/Command");

module.exports = class InviteCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "invite"
        });
    }

    async run(inter) {
        return inter.reply("[**INVITE ME ❤️**](https://discord.com/oauth2/authorize?client_id=843298069515730944&scope=bot+applications.commands&permissions=8)")
    }
}