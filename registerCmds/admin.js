"use strict";

// const { RESTPostAPIApplicationCommandsJSONBody, ApplicationCommandType, ApplicationCommandOptionType, ChannelType } = require("discord-api-types");

/* @type {RESTPostAPIApplicationCommandsJSONBody} */
module.exports = {
    name: "admin",
    description: "Server Settings and Administration",
    type: 1,
    options: [
        {
            name: "message-constructor",
            description: "Wanna create some custom message? Button roles? Or just simple rules embed? Try it!",
            type: 1,
        },
        {
            name: "settings",
            description: "Configure my settings",
            type: 1,
        },
        {
            name: "unban",
            description: "Sometimes somebody deserves a second chance",
            type: 1,
            options: [
                {
                    name: "user",
                    description: "User to give a second chance",
                    required: true,
                    type: 6,
                },
                {
                    name: "reason",
                    description: "Reason",
                    type: 3,
                },
            ],
        },
        {
            name: "steal",
            description: "Steal stuff to add to your server",
            type: 1,
        },
        {
            name: "lock",
            description: "Lock channels to stop raiders from spamming!",
            type: 1,
            options: [
                {
                    name: "channels",
                    description: "Channel mentions or Ids separated with ` ` (space)",
                    type: 3,
                },
                {
                    name: "category",
                    description: "If no channel provided, you can specify category instead to lock all its child",
                    type: 7,
                    channel_types: [4],
                },
                {
                    name: "ignore-roles",
                    description: "Ignore these role. Names, mentions or Ids separated with ` ` (space)",
                    type: 3,
                },
                {
                    name: "ignore-permissions",
                    description: "Ignore these permission, names separated with ` ` (space). Ex `manage-messages manage-guild`",
                    type: 3,
                },
                {
                    name: "duration",
                    type: 3,
                    description: "Ex `10h5w70s`",
                },
                {
                    name: "optimization",
                    type: 3,
                    description: "Helps the command run *a lil bit* faster by ignoring some overwrite that has specific permissions",
                    choices: [
                        {
                            name: "Yes",
                            value: "1",
                        },
                        {
                            name: "No",
                            value: "0",
                        },
                    ],
                },
                {
                    name: "reason",
                    description: "Reason",
                    type: 3,
                },
            ],
        },
        {
            name: "unlock",
            description: "Unlock locked channels",
            type: 1,
            options: [
                {
                    name: "channels",
                    description: "Channel mentions or Ids separated with ` ` (space)",
                    type: 3,
                },
                {
                    name: "category",
                    description: "If no channel provided, you can specify category instead to unlock all its child",
                    type: 7,
                    channel_types: [4],
                },
                {
                    name: "reason",
                    description: "Reason",
                    type: 3,
                },
            ],
        },
    ],
}