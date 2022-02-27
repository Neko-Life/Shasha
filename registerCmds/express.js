"use strict";

// const { RESTPostAPIApplicationCommandsJSONBody, ApplicationCommandType, ApplicationCommandOptionType } = require("discord-api-types");
const { EXPRESS_ENDPOINTS } = require("../rsc/constants");

// @type {RESTPostAPIApplicationCommandsJSONBody} */
module.exports = {
    name: "express",
    description: "Express yourself",
    type: 1,
    options: [
        {
            name: "expression",
            description: "Some feeling you wanna express?",
            required: true,
            type: 3,
            choices: EXPRESS_ENDPOINTS.map(r => { return { name: r.name || r, value: r.value || r } }),
        },
        {
            name: "message",
            description: "Message you wanna say",
            type: 3,
        },
    ],
}
