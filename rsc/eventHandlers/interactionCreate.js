'use strict';

const { Interaction } = require("discord.js");
const { join } = require("path");
const requireAll = require("require-all");
const handlers = requireAll({ dirname: join(__dirname, "../handlers") });
/**
 * @param {Interaction} interaction 
 */
async function handle(interaction) {
    if (interaction.isCommand()) {
        const subCG = !interaction.options._subcommand;
        if (!subCG || !interaction.options.data.length)
            return interaction.reply(`Specify ${interaction.commandName} category command in \`options\``);
        handlers.command.handle(interaction);
    }
}

module.exports = { handle }