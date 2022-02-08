"use strict";

// const { RESTPostAPIApplicationCommandsJSONBody, ApplicationCommandType, ApplicationCommandOptionType } = require("discord-api-types");

// @type {RESTPostAPIApplicationCommandsJSONBody} */
module.exports = {
    name: "fun",
    description: "Fun Category",
    type: 1,
    options: [
        {
            name: "say",
            description: "Say somethin using me",
            type: 1,
            options: [
                {
                    name: "text",
                    description: "Text to say",
                    type: 3,
                },
                {
                    name: "message",
                    description: "Say this message instead",
                    type: 3,
                    autocomplete: true,
                },
                {
                    name: "channel",
                    description: "Send in this channel",
                    channel_types: [0, 5, 10, 12, 11, 6],
                    type: 7
                },
            ],
        },
        {
            name: "8ball",
            description: "Ask me for certainty",
            type: 1,
            options: [
                {
                    name: "question",
                    description: "Your curiousity",
                    type: 3,
                    autocomplete: true,
                },
            ],
        },
        {
            name: "jumbo",
            description: "Make any emoji JUMBO",
            type: 1,
            options: [
                {
                    name: "emoji",
                    description: "Emoji to get JUMBO-ed",
                    required: true,
                    autocomplete: true,
                    type: 3,
                },
            ],
        },
        {
            name: "afk",
            description: "Lemme tell anyone who are looking for you that you're afk",
            type: 1,
            options: [
                {
                    name: "message",
                    description: "Leave a message before you gone afk",
                    type: 3,
                },
            ],
        },
        {
            name: "ascii",
            description: "The arts of _text_",
            type: 1,
            options: [
                {
                    name: "text",
                    description: "Text to transform",
                    type: 3,
                    autocomplete: true,
                },
                {
                    name: "font",
                    description: "Font to use",
                    type: 3,
                    autocomplete: true,
                },
            ],
        },
        {
            name: "snipe",
            description: "Do some undelete magik",
            type: 1,
            options: [
                {
                    name: "channel",
                    description: "Snipe this channel",
                    type: 7,
                    channel_types: [0, 5, 10, 12, 11, 6],
                },
            ],
        },
        {
            name: "big-text",
            description: "MAKE IT BEEEEG",
            type: 1,
            options: [
                {
                    name: "text",
                    description: "TEXT TO MAKE BEEEEG",
                    required: true,
                    type: 3,
                },
            ],
        },
    ],
}