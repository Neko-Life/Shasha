'use strict';

const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Embed maker")
    .addSubcommand(
        sCmd => sCmd
            .setName("create-fields-1")
            .setDescription("Create fields data to use in embed build command")
            .addStringOption(
                opt => opt
                    .setName("field-1-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-1-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-1-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            ).addStringOption(
                opt => opt
                    .setName("field-2-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-2-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-2-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            ).addStringOption(
                opt => opt
                    .setName("field-3-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-3-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-3-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            ).addStringOption(
                opt => opt
                    .setName("field-4-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-4-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-4-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            ).addStringOption(
                opt => opt
                    .setName("field-5-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-5-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-5-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            ).addStringOption(
                opt => opt
                    .setName("field-6-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-6-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-6-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            ).addStringOption(
                opt => opt
                    .setName("field-7-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-7-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-7-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            ).addStringOption(
                opt => opt
                    .setName("field-8-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-8-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-8-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("create-fields-2")
            .setDescription("Create fields data to use in embed build command")
            .addStringOption(
                opt => opt
                    .setName("field-9-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-9-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-9-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            ).addStringOption(
                opt => opt
                    .setName("field-10-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-10-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-10-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            ).addStringOption(
                opt => opt
                    .setName("field-11-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-11-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-11-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            ).addStringOption(
                opt => opt
                    .setName("field-12-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-12-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-12-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            ).addStringOption(
                opt => opt
                    .setName("field-13-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-13-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-13-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            ).addStringOption(
                opt => opt
                    .setName("field-14-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-14-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-14-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            ).addStringOption(
                opt => opt
                    .setName("field-15-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-15-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-15-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            ).addStringOption(
                opt => opt
                    .setName("field-16-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-16-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-16-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("create-fields-3")
            .setDescription("Create fields data to use in embed build command")
            .addStringOption(
                opt => opt
                    .setName("field-17-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-17-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-17-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            ).addStringOption(
                opt => opt
                    .setName("field-18-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-18-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-18-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            ).addStringOption(
                opt => opt
                    .setName("field-19-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-19-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-19-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            ).addStringOption(
                opt => opt
                    .setName("field-20-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-20-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-20-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            ).addStringOption(
                opt => opt
                    .setName("field-21-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-21-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-21-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            ).addStringOption(
                opt => opt
                    .setName("field-22-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-22-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-22-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            ).addStringOption(
                opt => opt
                    .setName("field-23-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-23-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-23-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            ).addStringOption(
                opt => opt
                    .setName("field-24-name")
                    .setDescription("Field name")
            ).addStringOption(
                opt => opt
                    .setName("field-24-text")
                    .setDescription("Field text")
            ).addStringOption(
                opt => opt
                    .setName("field-24-inline")
                    .setDescription("Set this field inline with `yes` or `true` or `1` as argument")
            )
    )