'use strict';

const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new SlashCommandBuilder()
    .setName("fun")
    .setDescription("Fun commands")
    .addSubcommand(
        sCmd => sCmd
            .setName("say")
            .setDescription("Say something using me")
            .addStringOption(
                opt => opt
                    .setName("text")
                    .setDescription("Text to send")
                    .setRequired(true)
            ).addChannelOption(
                opt => opt
                    .setName("channel")
                    .setDescription("Destination channel")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("8ball")
            .setDescription("Ask me for certainty")
            .addStringOption(
                opt => opt
                    .setName("question")
                    .setDescription("Your curiousness")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("jumbo")
            .setDescription("Make an emoji JUMBO")
            .addStringOption(
                opt => opt
                    .setName("emoji")
                    .setDescription("Emoji to get JUMBO-ed")
                    .setRequired(true)
                    .setAutocomplete(true)
            )
    );