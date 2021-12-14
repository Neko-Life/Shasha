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
                    .setDescription("Amount of message to delete. Up to 100")
            ).addStringOption(
                opt => opt
                    .setName("to-message")
                    .setDescription("Stop at this message")
                    .setAutocomplete(true)
            ).addStringOption(
                opt => opt
                    .setName("filter-user-ids")
                    .setDescription("Delete only messages from these users. Mentions or Ids separated with ` ` (space)")
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
            .setName("kick")
            .setDescription("Kick someone's ass")
            .addUserOption(
                opt => opt
                    .setName("member")
                    .setDescription("Ass to kick")
                    .setRequired(true)
            ).addStringOption(
                opt => opt
                    .setName("reason")
                    .setDescription("Reason")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("mute")
            .setDescription("Render shut em bulli")
            .addUserOption(
                opt => opt
                    .setName("user")
                    .setDescription("Bulli to moot")
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
            .setDescription("Render unshut em unbulli")
            .addUserOption(
                opt => opt
                    .setName("user")
                    .setDescription("Unbulli to unmoot")
                    .setRequired(true)
            ).addStringOption(
                opt => opt
                    .setName("reason")
                    .setDescription("Reason")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("ban")
            .setDescription("Lets put them at rest")
            .addUserOption(
                opt => opt
                    .setName("user")
                    .setDescription("User to put at rest")
                    .setRequired(true)
            ).addStringOption(
                opt => opt
                    .setName("duration")
                    .setDescription("Ex `432y876w75s87mo`")
                    .setAutocomplete(true)
            ).addStringOption(
                opt => opt
                    .setName("purge")
                    .setDescription("Clean the user's mess(ages)")
                    .addChoices([
                        ["Up to 7 days old", "7"],
                        ["Up to 6 days old", "6"],
                        ["Up to 5 days old", "5"],
                        ["Up to 4 days old", "4"],
                        ["Up to 3 days old", "3"],
                        ["Up to 2 days old", "2"],
                        ["Up to 1 day old", "1"],
                        ["Don't purge anything", "0"]
                    ])
            ).addStringOption(
                opt => opt
                    .setName("reason")
                    .setDescription("Reason")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("slowmode")
            .setDescription("Set slowmode duration of a chat")
            .addStringOption(
                opt => opt
                    .setName("duration")
                    .setDescription("Ex `3s5m` or `0`")
                    .setRequired(true)
            ).addChannelOption(
                opt => opt
                    .setName("channel")
                    .setDescription("Set for this channel instead")
                    .addChannelTypes([0, 5, 10, 12, 11, 6])
            ).addStringOption(
                opt => opt
                    .setName("reason")
                    .setDescription("Reason")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("vc-deafen")
            .setDescription("Deafen users in a VC")
            .addChannelOption(
                opt => opt
                    .setName("channel")
                    .setDescription("Deafen all user in this VC")
                    .addChannelTypes([2])
            ).addUserOption(
                opt => opt
                    .setName("user")
                    .setDescription("Deafen this specific user")
            ).addStringOption(
                opt => opt
                    .setName("reason")
                    .setDescription("Reason")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("vc-undeafen")
            .setDescription("Undeafen users in a VC")
            .addChannelOption(
                opt => opt
                    .setName("channel")
                    .setDescription("Undeafen all user in this VC")
                    .addChannelTypes([2])
            ).addUserOption(
                opt => opt
                    .setName("user")
                    .setDescription("Undeafen this specific user")
            ).addStringOption(
                opt => opt
                    .setName("reason")
                    .setDescription("Reason")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("vc-mute")
            .setDescription("Mute users in a VC")
            .addChannelOption(
                opt => opt
                    .setName("channel")
                    .setDescription("Mute all user in this VC")
                    .addChannelTypes([2])
            ).addUserOption(
                opt => opt
                    .setName("user")
                    .setDescription("Mute this specific user")
            ).addStringOption(
                opt => opt
                    .setName("reason")
                    .setDescription("Reason")
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("vc-unmute")
            .setDescription("Unmute users in a VC")
            .addChannelOption(
                opt => opt
                    .setName("channel")
                    .setDescription("Unmute all user in this VC")
                    .addChannelTypes([2])
            ).addUserOption(
                opt => opt
                    .setName("user")
                    .setDescription("Unmute this specific user")
            ).addStringOption(
                opt => opt
                    .setName("reason")
                    .setDescription("Reason")
            )
    )