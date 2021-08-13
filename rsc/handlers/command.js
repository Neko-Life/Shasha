'use strict';

const { CommandInteraction } = require("discord.js");

/**
 * @param {CommandInteraction} interaction 
 */
async function handle(interaction) {
    const group = interaction.client.commands[interaction.commandName];
    if (!group) return interaction.reply(`Category \`${interaction.commandName}\` not found. Maybe removed/hacked or somethin`);
    interaction.commands = {};
    for (const data of interaction.options.data) {
        if (!group[data.name]) return interaction.reply(`Command \`${data.name}\` not found. Maybe eaten or somethin i dunno`);
        interaction.commands[data.name] = new group[data.name](interaction);
        await interaction.commands[data.name].run(interaction, data.value);
    }
}

module.exports = { handle }