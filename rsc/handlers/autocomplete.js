'use strict';

const { AutocompleteInteraction } = require("discord.js");
const CommandHandler = require("./command");

module.exports = class AutocompleteHandler {
    /**
     * 
     * @param {AutocompleteInteraction} interaction 
     * @returns 
     */
    static async handle(interaction) {
        const cmd = CommandHandler.getInteractionCmd(interaction);
        if (!cmd) return;
        return cmd.handleAutocomplete(interaction, interaction.options.getFocused(true));
    }
}