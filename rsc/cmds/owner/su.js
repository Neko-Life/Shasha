'use strict';

const { CommandInteraction } = require("discord.js");
const { Command } = require("../../classes/Command");

module.exports = class SuCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "su",
            ownerOnly: true
        });
    }

    async run(inter, { user, command, args }) {
        new CommandInteraction(this.client)
    }
}