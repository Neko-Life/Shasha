'use strict';

const { Interaction, Guild } = require("discord.js");
const { join } = require("path");
const requireAll = require("require-all");
const { BaseDBManager } = require("../classes/Structures");
const handlers = requireAll({ dirname: join(__dirname, "../handlers") });
/**
 * @param {Interaction} interaction 
 */
async function handle(client, interaction) {
    await BaseDBManager.initAllDBManager(interaction);
    if (interaction.isCommand()) {
        const result = handlers.command.handle(interaction);
    } else if (interaction.isSelectMenu()) {
        const result = handlers.selectMenu.handle(interaction);
    }
}

module.exports = { handle }