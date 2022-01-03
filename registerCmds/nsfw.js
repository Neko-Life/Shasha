'use strict';

// const { RESTPostAPIApplicationCommandsJSONBody, ApplicationCommandType, ApplicationCommandOptionType } = require("discord-api-types");
const { NSFW_ENDPOINTS } = require("../rsc/constants");

/* @type {RESTPostAPIApplicationCommandsJSONBody} */
module.exports = {
    name: "nsfw",
    description: "Have some lewds",
    default_permission: false,
    type: 1,
    options: [
        {
            name: "image",
            description: "😳",
            type: 1,
            options: [
                {
                    name: "category",
                    description: "What kind you want? 😳",
                    type: 3,
                    choices: NSFW_ENDPOINTS.map(r => { return { name: r.name || r, value: r.value || r } }),
                },
            ],
        },
        {
            name: "fuck",
            description: "Fuck your partner 😳",
            type: 1,
            options: [
                {
                    name: "partner",
                    description: "Fuck this partner",
                    type: 6,
                },
                {
                    name: "message",
                    description: "Message you wanna say",
                    type: 3,
                },
            ],
        },
    ],
}