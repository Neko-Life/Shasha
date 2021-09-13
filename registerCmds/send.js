'use strict';

const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new SlashCommandBuilder()
    .setName("send")
    .setDescription("Send message with options")
    .addStringOption(
        opt => opt
            .setName("text")
            .setDescription("Text to send")
            .setRequired(true)
    ).addChannelOption(
        opt => opt
            .setName("channel")
            .setDescription("Destination channel")

    );