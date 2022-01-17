'use strict';

// const { RESTPostAPIApplicationCommandsJSONBody, ApplicationCommandType, ApplicationCommandOptionType } = require("discord-api-types");
const { ENUM_ACTIVITY_TYPES, PRESENCE_STATUSES } = require("../rsc/constants");

const presenceStatusChoices = [];
for (const k in PRESENCE_STATUSES)
    presenceStatusChoices.push({ name: k, value: PRESENCE_STATUSES[k] });

const presenceTypeChoices = [];
for (const k in ENUM_ACTIVITY_TYPES)
    presenceTypeChoices.push({ name: k, value: k });

/* @type {RESTPostAPIApplicationCommandsJSONBody} */
module.exports = {
    name: "owner",
    description: "Owner only",
    default_permission: false,
    type: 1,
    options: [
        {
            name: "eval",
            description: "Eval",
            type: 1,
            options: [
                {
                    name: "script",
                    description: "script",
                    type: 3,
                    autocomplete: true,
                },
                {
                    name: "split",
                    description: "split",
                    type: 3,
                    autocomplete: true,
                },
                {
                    name: "message",
                    description: "message",
                    type: 3,
                    autocomplete: true,
                },
            ],
        },
        {
            name: "register",
            description: "Register",
            type: 1,
            options: [
                {
                    name: "category",
                    description: "Category",
                    type: 3,
                    autocomplete: true,
                },
                {
                    name: "guild",
                    description: "Guild",
                    type: 3,
                    autocomplete: true,
                },
            ],
        },
        {
            name: "reload",
            description: "Reload",
            type: 1,
        },
        {
            name: "ban",
            description: "Ban",
            type: 1,
            options: [
                {
                    name: "user",
                    description: "User",
                    type: 3,
                    autocomplete: true,
                },
                {
                    name: "guild",
                    description: "Guild",
                    type: 3,
                    autocomplete: true,
                },
            ],
        },
        {
            name: "unban",
            description: "Unban",
            type: 1,
            options: [
                {
                    name: "user",
                    description: "User",
                    type: 3,
                    autocomplete: true,
                },
                {
                    name: "guild",
                    description: "Guild",
                    type: 3,
                    autocomplete: true,
                },
            ],
        },
        {
            name: "su",
            description: "SU",
            type: 1,
            options: [
                {
                    name: "user",
                    description: "User",
                    type: 6,
                },
                {
                    name: "command",
                    description: "Command",
                    type: 3,
                    autocomplete: true,
                },
                {
                    name: "args",
                    description: "Args",
                    type: 3,
                    autocomplete: true,
                }
            ]
        },
        {
            name: "presence",
            description: "Presence",
            type: 1,
            options: [
                {
                    name: "status",
                    description: "Status",
                    type: 3,
                    choices: presenceStatusChoices,
                },
                {
                    name: "afk",
                    description: "AFK",
                    type: 5,
                },
                {
                    name: "title",
                    description: "Title",
                    autocomplete: true,
                    type: 3,
                },
                {
                    name: "url",
                    description: "URL",
                    autocomplete: true,
                    type: 3,
                },
                {
                    name: "type",
                    description: "Type",
                    type: 3,
                    choices: presenceTypeChoices,
                },
            ],
        },
        {
            name: "info",
            description: "Info",
            type: 2,
            options: [
                {
                    name: "server",
                    description: "Server",
                    type: 1,
                    options: [
                        {
                            name: "identifier",
                            description: "Identifier",
                            type: 3,
                            autocomplete: true,
                        },
                    ],
                },
            ],
        },
        {
            name: "list-server",
            description: "List Server",
            type: 1,
        },
        {
            name: "find-mutual",
            description: "Find Mutual",
            type: 1,
            options: [
                {
                    name: "user",
                    description: "User",
                    type: 6,
                    required: true,
                },
            ],
        },
        {
            name: "reboot",
            description: "Reboot",
            type: 1,
        },
        {
            name: "die",
            description: "Die",
            type: 1,
        },
    ],
}