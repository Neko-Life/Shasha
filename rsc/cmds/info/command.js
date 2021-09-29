'use strict';

const { Command } = require("../../classes/Command");

module.exports = class HelpCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "command"
        });
    }

    async run(inter, { command }) { }
}