'use strict';

const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new SlashCommandBuilder()
    .setName("eval")
    .setDescription("Evaluate script (owner-only)")
    .addStringOption(
        opt => opt
            .setName("script")
            .setDescription("Script to evaluate")
    ).addStringOption(
        opt => opt
            .setName("message")
            .setDescription("Message contain script")
    );