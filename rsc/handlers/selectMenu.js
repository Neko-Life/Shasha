"use strict";

const { SelectMenuInteraction } = require("discord.js");

/**
 * 
 * @param {SelectMenuInteraction} interaction 
 * @returns 
 */
async function handle(interaction) {
    const path = interaction.customId.split("/");
    let cmd = interaction.client.messageInteraction.selectMenu;
    if (cmd) for (const U of path) {
        if (!U) continue;
        cmd = cmd[U];
        if (!cmd) break;
    }
    if (!cmd?.handle) {
        if (path[path.length - 1] !== "pages") return;
        else return interaction.reply({
            content: "Can't find that command, was sucked by a blackhole ig"
        });
    }
    const result = cmd.handle(interaction, interaction.values);
}

module.exports = { handle }