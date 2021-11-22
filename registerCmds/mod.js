'use strict';

const { SlashCommandBuilder } = require("@discordjs/builders");
// amount, channel, filterUser, filterContent, filterRegex, toMessage
module.exports = new SlashCommandBuilder()
    .setName("mod")
    .setDescription("Moderation commands")
    .addSubcommand(
        sCmd => sCmd
            .setName("purge")
            .setDescription("Clean a channel from spam")
            .addIntegerOption(
                opt => opt
                    .setName("amount")
                    .setDescription("Amount of message to delete")
            ).addStringOption(
                opt => opt
                    .setName("to-message")
                    .setDescription("Stop at this message")
                    .setAutocomplete(true)
            ).addUserOption(
                opt => opt
                    .setName("filter-user")
                    .setDescription("Delete only messages from this user")
            ).addStringOption(
                opt => opt
                    .setName("filter-content")
                    .setDescription("Delete only messages containing this text")
                    .setAutocomplete(true)
            ).addStringOption(
                opt => opt
                    .setName("filter-regex")
                    .setDescription("Delete only messages matching this regex. Ex `/f[uv]+[cjgd]k\\s+(yo+)?u\\./i`")
                    .setAutocomplete(true)
            ).addStringOption(
                opt => opt
                    .setName("attachment-only")
                    .setDescription("Delete only messages with attachment")
                    .addChoice("Attachment only", "1")
                    .addChoice("Don't delete messages with attachment", "0")
            ).addStringOption(
                opt => opt
                    .setName("bot-only")
                    .setDescription("Delete only messages from bots")
                    .addChoice("Bot only", "1")
                    .addChoice("Don't delete bot messages", "0")
            ).addStringOption(
                opt => opt
                    .setName("webhook-only")
                    .setDescription("Delete only webhooks")
                    .addChoice("Webhook only", "1")
                    .addChoice("Don't delete webhook messages", "0")
            ).addStringOption(
                opt => opt
                    .setName("include-pinned")
                    .setDescription("Also delete pinned messages")
                    .addChoice("Include pinned", "1")
                    .addChoice("Don't delete pinned messages", "0")
            ).addChannelOption(
                opt => opt
                    .setName("channel")
                    .setDescription("Execute in this channel")
                    .addChannelTypes([0, 5, 10, 12, 11, 6])
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("mute")
            .setDescription("Render shut em criminals")
            .addUserOption(
                opt => opt
                    .setName("user")
                    .setDescription("User to moot")
                    .setRequired(true)
            ).addStringOption(
                opt => opt
                    .setName("duration")
                    .setDescription("Ex `69y27mo7w8d122s420h`")
                    .setAutocomplete(true)
            ).addStringOption(
                opt => opt
                    .setName("reason")
                    .setDescription("Reason")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("unmute")
            .setDescription("Render unshut em uncriminals")
            .addUserOption(
                opt => opt
                    .setName("user")
                    .setDescription("User to unmoot")
                    .setRequired(true)
            ).addStringOption(
                opt => opt
                    .setName("reason")
                    .setDescription("Reason")
            )
    )