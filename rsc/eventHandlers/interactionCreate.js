'use strict';

const { Interaction } = require("discord.js");
const ShaClient = require("../classes/ShaClient");

/**
 * @param {ShaClient} client
 * @param {Interaction} interaction 
 */
async function handle(client, interaction) {
    if (interaction.isAutocomplete()) {
        client.handlers.autocomplete.handle(interaction);
    } else if (interaction.isButton()) { } else if (interaction.isCommand()) {
        client.handlers.command.handle(interaction);
    } else if (interaction.isSelectMenu()) {
        client.handlers.selectMenu.handle(interaction);
    }
}

module.exports = { handle }