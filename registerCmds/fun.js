'use strict';

const { SlashCommandBuilder, SlashCommandStringOption } = require("@discordjs/builders")

module.exports = new SlashCommandBuilder()
    .setName("fun")
    .addStringOption(
        cmd => cmd
            .setName("say")
            .setDescription("Say somethin")
    )
    .addStringOption(
        cmd => cmd
            .setName("send")
            .setDescription("Send to designated channel")
    )
    .setDescription("Fun commands");