"use strict";

// const { RESTPostAPIApplicationCommandsJSONBody, ApplicationCommandType, ApplicationCommandOptionType } = require("discord-api-types");
const EmbedStringsOptions = require("../rsc/subCmds/EmbedStringsOptions");

const fieldDatasOptions = [];
for (let i = 8; i > 0; i--) {
    fieldDatasOptions.unshift(
        {
            name: `field-${i}-name`,
            description: "Field name",
            type: 3,
        },
        {
            name: `field-${i}-text`,
            description: "Field text",
            type: 3,
        },
        {
            name: `field-${i}-inline`,
            description: "Set this field inline",
            type: 3,
            choices: [
                {
                    name: "yes",
                    value: "1",
                },
                {
                    name: "no",
                    value: "0",
                },
            ],
        },
    );
}

/* @type {RESTPostAPIApplicationCommandsJSONBody} */
module.exports = {
    name: "embed",
    description: "Embed Builder",
    type: 1,
    options: [
        {
            name: "build",
            description: "Build your custom embed",
            type: 1,
            options: EmbedStringsOptions,
        },
        {
            name: "join",
            description: "Join all embeds in messages to put in one message. 10 embeds maximum",
            type: 1,
            options: [
                {
                    name: "messages",
                    description: "Message links or Ids separated with ` ` (space)",
                    required: true,
                    type: 3,
                },
                {
                    name: "channel",
                    description: "Send to this channel",
                    channel_types: [0],
                    type: 3,
                },
                {
                    name: "content",
                    description: "Message content",
                    type: 3,
                },
                {
                    name: "attachments",
                    description: "Attachments to includes. Links separated with ` ` (space)",
                    type: 3,
                },
            ],
        },
        {
            name: "create-field-datas",
            description: "Create field datas to use in `/embed build` command",
            type: 1,
            options: fieldDatasOptions,
        },
    ],
}
