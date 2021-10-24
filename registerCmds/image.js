'use strict';

const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new SlashCommandBuilder()
    .setName("image")
    .setDescription("You like pics aren't you")
    .addSubcommand(
        sCmd => sCmd
            .setName("neko")
            .setDescription("NYAYAYAYAYAAA")
    );