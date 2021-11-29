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
            ).addStringOption(
                opt => opt
                    .setName("message")
                    .setDescription("Say this message")
                    .setAutocomplete(true)
            ).addChannelOption(
                opt => opt
                    .setName("channel")
                    .setDescription("Destination channel")
                    .addChannelTypes([0, 5, 10, 12, 11, 6])
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("8ball")
            .setDescription("Ask me for certainty")
            .addStringOption(
                opt => opt
                    .setName("question")
                    .setDescription("Your curiousness")
                    .setAutocomplete(true)
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
    ).addSubcommand(
        sCmd => sCmd
            .setName("afk")
            .setDescription("Lemme tell anyone who are looking for you that you're afk")
            .addStringOption(
                opt => opt
                    .setName("message")
                    .setDescription("Message you want to tell")
                    .setAutocomplete(true)
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("ascii")
            .setDescription("Lemme show you the arts of _text_")
            .addStringOption(
                opt => opt
                    .setName("text")
                    .setDescription("Text to tranform")
                    .setAutocomplete(true)
            ).addStringOption(
                opt => opt
                    .setName("font")
                    .setDescription("Font to use")
                    .setAutocomplete(true)
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("snipe")
            .setDescription("Do some undelete magik")
            .addChannelOption(
                opt => opt
                    .setName("channel")
                    .setDescription("Snipe this channel")
                    .addChannelTypes([0, 5, 10, 12, 11, 6])
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("big-text")
            .setDescription("MAKE IT BEEEG")
            .addStringOption(
                opt => opt
                    .setName("text")
                    .setDescription("TEXT TO MAKE BEEEEEG")
                    .setRequired(true)
            )
    )