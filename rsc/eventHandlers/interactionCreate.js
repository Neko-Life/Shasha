'use strict';

const { Interaction } = require("discord.js");
const { join } = require("path");
const requireAll = require("require-all");
const handlers = requireAll({ dirname: join(__dirname, "../handlers") });
/**
 * @param {Interaction} interaction 
 */
async function handle(client, interaction) {
    if (interaction.isCommand()) {
        const result = handlers.command.handle(interaction);
    }
}

module.exports = { handle }