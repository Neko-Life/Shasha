'use strict';

// const { RESTPostAPIApplicationCommandsJSONBody, ApplicationCommandType, ApplicationCommandOptionType } = require("discord-api-types");
const { INTERACT_ENDPOINTS } = require("../rsc/constants");

/* @type {RESTPostAPIApplicationCommandsJSONBody} */
module.exports = {
    name: "interact",
    description: "Interact with your friends",
    type: 1,
    options: [
        {
            name: "interaction",
            description: "Kind of interaction you wanna do",
            type: 3,
            choices: INTERACT_ENDPOINTS.map(r => { return { name: r.name || r, value: r.value || r } }),
            required: true,
        },
        {
            name: "user",
            description: "User you wanna interact with",
            type: 6,
        },
        {
            name: "message",
            description: "Message you wanna say",
            type: 3,
        },
    ],
}