'use strict';

const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new SlashCommandBuilder()
    .setName("send")
    .setDescription("Send message with options")
    .addSubcommand(
        sCmd => sCmd
            .setName("text")
            .setDescription("Send text content")
            .addStringOption(
                opt => opt
                    .setName("text")
                    .setDescription("Text to send")
                    .setRequired(true)
            ).addChannelOption(
                opt => opt
                    .setName("channel")
                    .setDescription("Destination channel")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("embed")
            .setDescription("Send message embed")
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
                    .setDescription("Put \`y\` to set this field to be inline")
            ).addStringOption(
                opt => opt
                    .setName("field-datas")
                    .setDescription("Field datas message")
            )
        // .addStringOption(
        //     opt => opt
        //         .setName("field-2-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-2-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-2-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-3-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-3-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-3-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-4-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-4-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-4-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-5-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-5-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-5-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-6-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-6-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-6-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-7-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-7-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-7-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-8-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-8-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-8-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-9-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-9-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-9-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-10-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-10-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-10-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-11-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-11-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-11-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-12-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-12-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-12-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-13-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-13-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-13-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-14-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-14-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-14-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-15-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-15-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-15-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-16-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-16-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-16-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-17-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-17-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-17-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-18-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-18-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-18-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-19-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-19-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-19-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-20-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-20-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-20-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-21-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-21-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-21-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-22-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-22-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-22-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-23-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-23-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-23-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-24-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-24-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-24-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-25-name")
        //         .setDescription("Embed field name")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-25-text")
        //         .setDescription("Embed field text")
        // ).addStringOption(
        //     opt => opt
        //         .setName("field-25-inline")
        //         .setDescription("Put \`y\` to set this field to be inline")
        // )
    );