'use strict';

const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new SlashCommandBuilder()
    .setName("owner")
    .setDescription("Owner only")
    .addSubcommand(
        sCmd => sCmd
            .setName("eval")
            .setDescription("Owner only")
            .addStringOption(
                opt => opt
                    .setName("script")
                    .setDescription("Owner only")
            ).addStringOption(
                opt => opt
                    .setName("message")
                    .setDescription("Owner only")
            ).addStringOption(
                opt => opt
                    .setName("split")
                    .setDescription("Owner only")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("register")
            .setDescription("Owner only")
            .addStringOption(
                opt => opt
                    .setName("category")
                    .setDescription("Owner only")
            ).addStringOption(
                opt => opt
                    .setName("guild")
                    .setDescription("Owner only")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("reload")
            .setDescription("Owner only")
    ).addSubcommand(
        sCmd => sCmd
            .setName("ban")
            .setDescription("Owner only")
            .addStringOption(
                opt => opt
                    .setName("user")
                    .setDescription("Owner only")
            ).addStringOption(
                opt => opt
                    .setName("guild")
                    .setDescription("Owner only")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("unban")
            .setDescription("Owner only")
            .addStringOption(
                opt => opt
                    .setName("user")
                    .setDescription("Owner only")
            ).addStringOption(
                opt => opt
                    .setName("guild")
                    .setDescription("Owner only")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("su")
            .setDescription("Owner only")
            .addUserOption(
                opt => opt
                    .setName("user")
                    .setDescription("Owner only")
            ).addStringOption(
                opt => opt
                    .setName("command")
                    .setDescription("Owner only")
            ).addStringOption(
                opt => opt
                    .setName("args")
                    .setDescription("Owner only")
            )
    )