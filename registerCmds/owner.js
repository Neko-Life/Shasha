'use strict';

const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new SlashCommandBuilder()
    .setName("owner")
    .setDescription("I accept these commands from my master only")
    .addSubcommand(
        sCmd => sCmd
            .setName("eval")
            .setDescription("Evaluate script (owner-only)")
            .addStringOption(
                opt => opt
                    .setName("script")
                    .setDescription("Script to evaluate")
            ).addStringOption(
                opt => opt
                    .setName("message")
                    .setDescription("Message containing script")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("register")
            .setDescription("Run registerCommands")
            .addStringOption(
                opt => opt
                    .setName("category")
                    .setDescription("Category to register")
            ).addStringOption(
                opt => opt
                    .setName("guild")
                    .setDescription("Register the category in this guild")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("reload")
            .setDescription("Reload teh gunz")
    ).addSubcommand(
        sCmd => sCmd
            .setName("ban")
            .setDescription("Command ban")
            .addUserOption(
                opt => opt
                    .setName("user")
                    .setDescription("User to ban")
            ).addStringOption(
                opt => opt
                    .setName("guild")
                    .setDescription("Guild to ban")
            )
    );