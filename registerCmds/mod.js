'use strict';

// const { RESTPostAPIApplicationCommandsJSONBody, ApplicationCommandType, ApplicationCommandOptionType } = require("discord-api-types");

/* @type {RESTPostAPIApplicationCommandsJSONBody} */
module.exports = {
    name: "mod",
    description: "Moderation Commands",
    options: [
        {
            type: 1,
            name: "purge",
            description: "Clean a channel from spam",
            options: [
                {
                    type: 4,
                    name: "amount",
                    description: "Amount of message to delete. Up to 100",
                },
                {
                    type: 3,
                    name: "to-message",
                    description: "Stop at this message",
                    autocomplete: true,
                },
                {
                    type: 3,
                    name: "filter-user-ids",
                    description: "Delete only messages from these users. Mentions or Ids separated with ` ` (space)",
                },
                {
                    type: 6,
                    name: "filter-user",
                    description: "Delete only messages from this user",
                },
                {
                    type: 3,
                    name: "filter-content",
                    description: "Delete only messages containing this text",
                    autocomplete: true,
                },
                {
                    type: 3,
                    name: "filter-regex",
                    description: "Delete only messages matching this regex. Ex `/f[uv]+[cjgd]k\\s+(yo+)?u\\./i`",
                    autocomplete: true,
                },
                {
                    type: 3,
                    name: "attachment-only",
                    description: "Delete only messages with attachment",
                    choices: [
                        {
                            name: "Attachment only",
                            value: "1"
                        },
                        {
                            name: "Don't delete messages with attachment",
                            value: "0"
                        }
                    ]
                },
                {
                    type: 3,
                    name: "bot-only",
                    description: "Delete only messages from bots",
                    choices: [
                        {
                            name: "Bot only",
                            value: "1"
                        },
                        {
                            name: "Don't delete bot messages",
                            value: "0"
                        }
                    ]
                },
                {
                    type: 3,
                    name: "webhook-only",
                    description: "Delete only webhooks",
                    choices: [
                        {
                            name: "Webhook only",
                            value: "1"
                        },
                        {
                            name: "Don't delete webhook messages",
                            value: "0"
                        }
                    ]
                },
                {
                    type: 3,
                    name: "include-pinned",
                    description: "Also delete pinned messages",
                    choices: [
                        {
                            name: "Include pinned",
                            value: "1"
                        },
                        {
                            name: "Don't delete pinned messages",
                            value: "0"
                        }
                    ]
                },
                {
                    type: 7,
                    name: "channel",
                    description: "Execute in this channel",
                    channel_types: [0, 5, 10, 12, 11, 6],
                }
            ]
        },
        {
            type: 1,
            name: "kick",
            description: "Kick someone's ass",
            options: [
                {
                    type: 6,
                    name: "member",
                    description: "Ass to kick",
                    required: true
                },
                {
                    type: 3,
                    name: "reason",
                    description: "Reason",
                }
            ]
        },
        {
            type: 1,
            name: "mute",
            description: "Render shut em bulli",
            options: [
                {
                    type: 6,
                    name: "user",
                    description: "Bulli to moot",
                    required: true
                },
                {
                    type: 3,
                    name: "duration",
                    description: "Ex `69y27mo7w8d122s420h`",
                },
                {
                    type: 3,
                    name: "reason",
                    description: "Reason",
                }
            ]
        },
        {
            type: 1,
            name: "unmute",
            description: "Render unshut em unbulli",
            options: [
                {
                    type: 6,
                    name: "user",
                    description: "Unbulli to unmoot",
                    required: true
                },
                {
                    type: 3,
                    name: "reason",
                    description: "Reason",
                }
            ]
        },
        {
            type: 1,
            name: "ban",
            description: "Lets put them at rest",
            options: [
                {
                    type: 6,
                    name: "user",
                    description: "User to put at rest",
                    required: true
                },
                {
                    type: 3,
                    name: "duration",
                    description: "Ex `432y876w75s87mo`",
                },
                {
                    type: 3,
                    name: "purge",
                    description: "Clean the user's mess(ages)",
                    choices: [
                        {
                            name: "Up to 7 days old",
                            value: "7"
                        },
                        {
                            name: "Up to 6 days old",
                            value: "6"
                        },
                        {
                            name: "Up to 5 days old",
                            value: "5"
                        },
                        {
                            name: "Up to 4 days old",
                            value: "4"
                        },
                        {
                            name: "Up to 3 days old",
                            value: "3"
                        },
                        {
                            name: "Up to 2 days old",
                            value: "2"
                        },
                        {
                            name: "Up to 1 day old",
                            value: "1"
                        },
                        {
                            name: "Don't purge anything",
                            value: "0"
                        }
                    ]
                },
                {
                    type: 3,
                    name: "reason",
                    description: "Reason",
                }
            ]
        },
        {
            type: 1,
            name: "slowmode",
            description: "Set slowmode duration of a chat",
            options: [
                {
                    type: 3,
                    name: "duration",
                    description: "Ex `3s5m` or `0`",
                    required: true
                },
                {
                    type: 7,
                    name: "channel",
                    description: "Set for this channel instead",
                    channel_types: [0, 5, 10, 12, 11, 6],
                },
                {
                    type: 3,
                    name: "reason",
                    description: "Reason",
                }
            ]
        },
        {
            type: 1,
            name: "vc-deafen",
            description: "Deafen users in a VC",
            options: [
                {
                    type: 7,
                    name: "channel",
                    description: "Deafen all user in this VC",
                    channel_types: [
                        2
                    ]
                },
                {
                    type: 6,
                    name: "user",
                    description: "Deafen this specific user",
                },
                {
                    type: 3,
                    name: "reason",
                    description: "Reason",
                }
            ]
        },
        {
            type: 1,
            name: "vc-undeafen",
            description: "Undeafen users in a VC",
            options: [
                {
                    type: 7,
                    name: "channel",
                    description: "Undeafen all user in this VC",
                    channel_types: [
                        2
                    ]
                },
                {
                    type: 6,
                    name: "user",
                    description: "Undeafen this specific user",
                },
                {
                    type: 3,
                    name: "reason",
                    description: "Reason",
                }
            ]
        },
        {
            type: 1,
            name: "vc-mute",
            description: "Mute users in a VC",
            options: [
                {
                    type: 7,
                    name: "channel",
                    description: "Mute all user in this VC",
                    channel_types: [
                        2
                    ]
                },
                {
                    type: 6,
                    name: "user",
                    description: "Mute this specific user",
                },
                {
                    type: 3,
                    name: "reason",
                    description: "Reason",
                }
            ]
        },
        {
            type: 1,
            name: "vc-unmute",
            description: "Unmute users in a VC",
            options: [
                {
                    type: 7,
                    name: "channel",
                    description: "Unmute all user in this VC",
                    channel_types: [
                        2
                    ]
                },
                {
                    type: 6,
                    name: "user",
                    description: "Unmute this specific user",
                },
                {
                    type: 3,
                    name: "reason",
                    description: "Reason",
                }
            ]
        }
    ]
}