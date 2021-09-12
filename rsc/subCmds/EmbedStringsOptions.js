'use strict';

const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

module.exports = new SlashCommandSubcommandBuilder()
    .addStringOption(
        opt => opt
            .setName("edit")
            .setDescription("Embed in a message to edit")
    ).addStringOption(
        opt => opt
            .setName("json")
            .setDescription("Use message embed JSON")
    ).addStringOption(
        opt => opt
            .setName("title")
            .setDescription("Embed title")
    ).addStringOption(
        opt => opt
            .setName("description")
            .setDescription("Embed description")
    ).addStringOption(
        opt => opt
            .setName("author-name")
            .setDescription("Embed author name")
    ).addStringOption(
        opt => opt
            .setName("author-icon")
            .setDescription("Embed author icon URL")
    ).addStringOption(
        opt => opt
            .setName("author-url")
            .setDescription("Embed author URL")
    ).addStringOption(
        opt => opt
            .setName("image")
            .setDescription("Embed image")
    ).addStringOption(
        opt => opt
            .setName("thumbnail")
            .setDescription("Embed thumbnail")
    ).addStringOption(
        opt => opt
            .setName("color")
            .setDescription("Embed color")
    ).addStringOption(
        opt => opt
            .setName("footer-text")
            .setDescription("Embed footer text")
    ).addStringOption(
        opt => opt
            .setName("footer-icon")
            .setDescription("Embed footer icon URL")
    ).addStringOption(
        opt => opt
            .setName("content")
            .setDescription("Message text content")
    ).addStringOption(
        opt => opt
            .setName("url")
            .setDescription("Embed title URL")
    ).addStringOption(
        opt => opt
            .setName("attachments")
            .setDescription("Embed attachments [URL]")
    ).addStringOption(
        opt => opt
            .setName("timestamp")
            .setDescription("Embed timestamp")
    ).addChannelOption(
        opt => opt
            .setName("channel")
            .setDescription("Destination channel")
    ).addStringOption(
        opt => opt
            .setName("field-name")
            .setDescription("Embed field name")
    ).addStringOption(
        opt => opt
            .setName("field-text")
            .setDescription("Embed field text")
    ).addStringOption(
        opt => opt
            .setName("field-inline")
            .setDescription("Set this field inline with `yes` or `true` or `y` or `1` as argument")
    ).addStringOption(
        opt => opt
            .setName("field-datas")
            .setDescription("Field datas message")
    )