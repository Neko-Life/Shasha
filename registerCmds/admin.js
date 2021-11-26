'use strict';

const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Guild Settings and Administration")
    .addSubcommand(
        sCmd => sCmd
            .setName("enable")
            .setDescription("Reset command/category setting for every channel. Default command permissions requirement apply")
            .addStringOption(
                opt => opt
                    .setName("command")
                    .setDescription("Command/category to reset (configure everything using `/admin disable`)")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("disable")
            .setDescription("Disable command/category")
            .addStringOption(
                opt => opt
                    .setName("command")
                    .setDescription("Command/category to disable. Example: `/info server`")
            ).addStringOption(
                opt => opt
                    .setName("channels")
                    .setDescription("Setting for these channels. Mentions, names or Ids separated with ` ` (space)")
            ).addStringOption(
                opt => opt
                    .setName("bypass-roles")
                    .setDescription("Roles bypass. Mentions or Ids separated with ` ` (space). `none` to reset")
            ).addStringOption(
                opt => opt
                    .setName("bypass-permissions")
                    .setDescription("Permissions bypass. Permissions separated with ` ` (space). `none` to reset")
            ).addStringOption(
                opt => opt
                    .setName("bypass-users")
                    .setDescription("User bypass. Mentions, names or Ids separated with ` ` (space). `none` to reset")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("settings")
            .setDescription("Configure my settings")
    )