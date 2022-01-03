'use strict';

// const { RESTPostAPIApplicationCommandsJSONBody, ApplicationCommandType, ApplicationCommandOptionType } = require("discord-api-types");

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
    ],
}