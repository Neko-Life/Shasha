'use strict';

const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new SlashCommandBuilder()
    .setName("info")
    .setDescription("Anything's info")
    .addSubcommand(
        sCmd => sCmd
            .setName("avatar")
            .setDescription("Show someone's avatar")
            .addUserOption(
                opt => opt
                    .setName("user")
                    .setDescription("User to see the avatar")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("profile")
            .setDescription("Show someone's profile")
            .addUserOption(
                opt => opt
                    .setName("user")
                    .setDescription("User to see the profile")
            )
    )