'use strict';

const { SlashCommandBuilder } = require("@discordjs/builders");
const { addSubcommand } = require("./embed");

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
    ).addSubcommand(
        sCmd => sCmd
            .setName("role")
            .setDescription("About a role")
            .addRoleOption(
                opt => opt
                    .setName("role")
                    .setDescription("Role to see about")
                    .setRequired(true)
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("server")
            .setDescription("Fetch server profile")
            .addStringOption(
                opt => opt
                    .setName("identifier")
                    .setDescription("Exact name or Id of the server too look at")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("channel")
            .setDescription("About a server channel")
            .addChannelOption(
                opt => opt
                    .setName("channel")
                    .setDescription("Channel to look at")
                    .setRequired(true)
            )
    )