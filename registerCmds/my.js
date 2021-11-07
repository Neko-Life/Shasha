'use strict';

const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new SlashCommandBuilder()
    .setName("my")
    .setDescription("About me")
    .addSubcommand(
        sCmd => sCmd
            .setName("invite")
            .setDescription("Give you my invite link ❤️")
    ).addSubcommand(
        sCmd => sCmd
            .setName("support")
            .setDescription("Get help from the support server")
    ).addSubcommand(
        sCmd => sCmd
            .setName("stats")
            .setDescription("Show my stats")
    )