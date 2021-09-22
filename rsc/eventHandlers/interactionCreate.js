'use strict';

const { Interaction, Guild } = require("discord.js");
const { BaseDBManager } = require("../classes/Structures");
/**
 * @param {Interaction} interaction 
 */
async function handle(client, interaction) {
    // await BaseDBManager.initAllDBManager(interaction);
    if (interaction.isCommand()) {
        const result = client.handlers.command.handle(interaction);
    } else if (interaction.isSelectMenu()) {
        const result = client.handlers.selectMenu.handle(interaction);
    }
}

module.exports = { handle }