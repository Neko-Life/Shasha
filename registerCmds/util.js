'use strict';

const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new SlashCommandBuilder()
    .setName("util")
    .setDescription("Anything utility")
    .addSubcommand(
        sCmd => sCmd
            .setName("translate")
            .setDescription("Translate from alien languages")
            .addStringOption(
                opt => opt
                    .setName("text")
                    .setDescription("Text to translate")
            ).addStringOption(
                opt => opt
                    .setName("lang-to")
                    .setDescription("To this language (default to `english`)")
            ).addStringOption(
                opt => opt
                    .setName("lang-from")
                    .setDescription("From this language (if you want to specify the source language)")
            ).addStringOption(
                opt => opt
                    .setName("message")
                    .setDescription("Translate this message: `<link>`, `<Id>`, `l` or `last`")
            )
    )