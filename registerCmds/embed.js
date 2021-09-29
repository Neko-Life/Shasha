'use strict';

const { SlashCommandBuilder } = require("@discordjs/builders");
const EmbedStringsOptions = require("../rsc/subCmds/EmbedStringsOptions");

module.exports = new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Embed maker")
    .addSubcommand(
        sCmd => EmbedStringsOptions
            .setName("build")
            .setDescription("Build embed")
    ).addSubcommand(
        sCmd => sCmd
            .setName("join")
            .setDescription("Join all embeds in messages to put in one message. 10 embeds maximum")
            .addStringOption(
                opt => opt
                    .setName("messages")
                    .setDescription("Message links or Ids separated with ` ` (space)")
                    .setRequired(true)
            ).addChannelOption(
                opt => opt
                    .setName("channel")
                    .setDescription("Channel to send in")
            ).addStringOption(
                opt => opt
                    .setName("content")
                    .setDescription("Message content")
            ).addStringOption(
                opt => opt
                    .setName("attachments")
                    .setDescription("Attachments to include. Links separated with ` ` (space)")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("create-field-datas")
            .setDescription("Create field datas to use in embed build command")
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
                    .addChoice("yes", "1")
                    .addChoice("no", "0")
                    .setDescription("Set this field inline")
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
                    .addChoice("yes", "1")
                    .addChoice("no", "0")
                    .setDescription("Set this field inline")
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
                    .addChoice("yes", "1")
                    .addChoice("no", "0")
                    .setDescription("Set this field inline")
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
                    .addChoice("yes", "1")
                    .addChoice("no", "0")
                    .setDescription("Set this field inline")
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
                    .addChoice("yes", "1")
                    .addChoice("no", "0")
                    .setDescription("Set this field inline")
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
                    .addChoice("yes", "1")
                    .addChoice("no", "0")
                    .setDescription("Set this field inline")
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
                    .addChoice("yes", "1")
                    .addChoice("no", "0")
                    .setDescription("Set this field inline")
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
                    .addChoice("yes", "1")
                    .addChoice("no", "0")
                    .setDescription("Set this field inline")
            )
    )