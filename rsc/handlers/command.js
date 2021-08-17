'use strict';

const { CommandInteraction } = require("discord.js");

/**
 * @param {CommandInteraction} interaction 
 */
async function handle(interaction) {
    const category = interaction.client.commands[interaction.commandName];
    interaction.args = {};
    if (!category)
        return interaction.reply(
            `Category \`${interaction.commandName}\` not found. Maybe removed/hacked or somethin`
        );
    let subCategory, cmd, toArgs;
    if (interaction.options._group) {
        subCategory = category[interaction.options._group];
        if (!subCategory)
            return interaction.reply(
                `Sub-category \`${interaction.options._group}\` got sucked into a blackhole and gone forever`
            );
        toArgs = interaction.options.data[0].options[0].options[0].options;
    }
    if (interaction.options._subcommand) {
        if (subCategory) {
            cmd = subCategory[interaction.options._subcommand];
            toArgs = interaction.options.data[0].options[0].options;
        } else {
            cmd = category[interaction.options._subcommand];
            toArgs = interaction.options.data[0].options;
        }
        if (!cmd)
            return interaction.reply(
                `Command \`${interaction.options._subcommand}\` was eaten by _me_. I'm not sorry cuz i'm hungry`
            );
    } else {
        cmd = category;
        toArgs = interaction.options.data;
    }

    if (toArgs?.length)
        for (const D of toArgs) {
            interaction.args[D.name] = D;
        };

    return new cmd(interaction).run(interaction, interaction.args);
}

module.exports = { handle }