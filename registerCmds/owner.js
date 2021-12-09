'use strict';

const { SlashCommandBuilder, SlashCommandStringOption } = require("@discordjs/builders");
const { ENUM_ACTIVITY_TYPES, PRESENCE_STATUSES } = require("../rsc/constants");

const presenceOpt = new SlashCommandStringOption()
    .setName("status")
    .setDescription("Owner only");

for (const k in PRESENCE_STATUSES)
    presenceOpt.addChoice(k, PRESENCE_STATUSES[k]);

const activityTypeOpt = new SlashCommandStringOption()
    .setName("type")
    .setDescription("Owner only");

for (const k in ENUM_ACTIVITY_TYPES)
    activityTypeOpt.addChoice(k, k);

module.exports = new SlashCommandBuilder()
    .setName("owner")
    .setDescription("Owner only")
    .setDefaultPermission(false)
    .addSubcommand(
        sCmd => sCmd
            .setName("eval")
            .setDescription("Owner only")
            .addStringOption(
                opt => opt
                    .setName("script")
                    .setDescription("Owner only")
                    .setAutocomplete(true)
            ).addStringOption(
                opt => opt
                    .setName("split")
                    .setDescription("Owner only")
                    .setAutocomplete(true)
            ).addStringOption(
                opt => opt
                    .setName("message")
                    .setDescription("Owner only")
                    .setAutocomplete(true)
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("register")
            .setDescription("Owner only")
            .addStringOption(
                opt => opt
                    .setName("category")
                    .setDescription("Owner only")
                    .setAutocomplete(true)
            ).addStringOption(
                opt => opt
                    .setName("guild")
                    .setDescription("Owner only")
                    .setAutocomplete(true)
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
                    .setAutocomplete(true)
            ).addStringOption(
                opt => opt
                    .setName("guild")
                    .setDescription("Owner only")
                    .setAutocomplete(true)
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("unban")
            .setDescription("Owner only")
            .addStringOption(
                opt => opt
                    .setName("user")
                    .setDescription("Owner only")
                    .setAutocomplete(true)
            ).addStringOption(
                opt => opt
                    .setName("guild")
                    .setDescription("Owner only")
                    .setAutocomplete(true)
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
    ).addSubcommand(
        sCmd => sCmd
            .setName("presence")
            .setDescription("Owner only")
            .addStringOption(
                opt => presenceOpt
            ).addBooleanOption(
                opt => opt
                    .setName("afk")
                    .setDescription("Owner only")
            ).addStringOption(
                opt => opt
                    .setName("title")
                    .setDescription("Owner only")
                    .setAutocomplete(true)
            ).addStringOption(
                opt => opt
                    .setName("url")
                    .setDescription("Owner only")
            ).addStringOption(
                opt => activityTypeOpt
            )
    ).addSubcommandGroup(
        sCmd => sCmd
            .setName("info")
            .setDescription("Owner only")
            .addSubcommand(
                sCmd => sCmd
                    .setName("server")
                    .setDescription("Owner only")
                    .addStringOption(
                        opt => opt
                            .setName("identifier")
                            .setDescription("Owner only")
                            .setAutocomplete(true)
                    )
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("list-server")
            .setDescription("Owner only")
    ).addSubcommand(
        sCmd => sCmd
            .setName("find-mutual")
            .setDescription("Owner Only")
            .addUserOption(
                opt => opt
                    .setName("user")
                    .setDescription("Owner only")
                    .setRequired(true)
            )
    )