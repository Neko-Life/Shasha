'use strict';

// const { RESTPostAPIApplicationCommandsJSONBody, ApplicationCommandType, ApplicationCommandOptionType } = require("discord-api-types");

/* @type {RESTPostAPIApplicationCommandsJSONBody} */
module.exports = {
    name: "info",
    description: "Anything Info",
    type: 1,
    options: [
        {
            name: "profile",
            description: "View someone's profile",
            type: 1,
            options: [
                {
                    name: "user",
                    description: "User to view the profile",
                    type: 6,
                },
            ],
        },
        {
            name: "role",
            description: "View a role info",
            type: 1,
            options: [
                {
                    name: "role",
                    description: "Role to view the info",
                    type: 8,
                },
            ],
        },
        {
            name: "server",
            description: "Fetch server profile",
            type: 1,
            options: [
                {
                    name: "identifier",
                    description: "Exact name or Id of the server too look at",
                    autocomplete: true,
                    type: 3,
                },
            ],
        },
        {
            name: "channel",
            description: "View channel info",
            type: 1,
            options: [
                {
                    name: "channnel",
                    description: "Channel to view the info",
                    type: 7,
                },
            ],
        },
        {
            name: "permissions",
            description: "View user or role permissions",
            type: 1,
            options: [
                {
                    name: "permissions-for",
                    description: "User or role to view their permissions",
                    type: 9,
                },
                {
                    name: "channel",
                    description: "Permissions in this channel",
                    type: 7,
                },
            ],
        },
        {
            name: "emoji",
            description: "View an emoji info",
            type: 1,
            options: [
                {
                    name: "emoji",
                    description: "Emoji to view about",
                    type: 3,
                    required: true,
                    autocomplete: true,
                },
            ],
        },
    ],
}