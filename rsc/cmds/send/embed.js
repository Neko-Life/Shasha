'use strict';

const { Command } = require("../../classes/Command");

module.exports = class EmbedCmd extends Command {
    constructor(interaction) {
        super(interaction, { name: "embed" });
    }
    async run(inter, data) {
        return inter.reply("Command's in testing phase...");
    }
}