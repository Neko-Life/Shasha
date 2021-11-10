'use strict';

const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new SlashCommandBuilder()
    .setName("info")
    .setDescription("Anything's info")
    .addSubcommand(
        sCmd => sCmd
            .setName("profile")
            .setDescription("Show someone's profile")
            .addUserOption(
                opt => opt
                    .setName("user")
                    .setDescription("User to see the profile")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("role")
            .setDescription("About a role")
            .addRoleOption(
                opt => opt
                    .setName("role")
                    .setDescription("Role to see about")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("server")
            .setDescription("Fetch server profile")
            .addStringOption(
                opt => opt
                    .setName("identifier")
                    .setDescription("Exact name or Id of the server too look at")
                    .setAutocomplete(true)
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("channel")
            .setDescription("About a server channel")
            .addChannelOption(
                opt => opt
                    .setName("channel")
                    .setDescription("Channel to look at")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("permissions")
            .setDescription("See someone's or some role's permissions")
            .addMentionableOption(
                opt => opt
                    .setName("permissions-for")
                    .setDescription("Someone or some role")
            ).addChannelOption(
                opt => opt
                    .setName("channel")
                    .setDescription("In channel")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("emoji")
            .setDescription("Show about an emoji")
            .addStringOption(
                opt => opt
                    .setName("emoji")
                    .setDescription("Emoji to see about")
                    .setRequired(true)
                    .setAutocomplete(true)
            )
    )