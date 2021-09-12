'use strict';

const { Command } = require("../classes/Command");
const expressCmd = require("../rsc/expressCmd");

const EXPRESS_ENDPOINTS = ["smile", "smug", "laugh", "baka", "cry", "dance", "wave", "blush", "bored", "facepalm", "happy", "pout", "shrug", "sleep", "think", "thumbsup"];
const EXPRESS_TEXTS = {
    "smile": " is smiling",
    "smug": " got a smug face",
    "laugh": " is laughing",
    "baka": " thinks you're a b- baka!",
    "cry": " is crying",
    "dance": " is shaking their booty",
    "wave": " is waving",
    "blush": " is blushing",
    "bored": " is bored",
    "facepalm": " is disappointed",
    "happy": " is happy",
    "pout": " is pouting",
    "shrug": " is not sure",
    "sleep": " is sleepy",
    "think": " is thinking",
    "thumbsup": " agreed"
}

module.exports = class ExpressCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "express",
            clientPermissions: ["EMBED_LINKS"]
        });
    }

    async run(inter, { expression, message }) {
        return expressCmd(inter, expression.value, EXPRESS_TEXTS[expression.value], message?.value);
    }
}

module.exports.constant = { EXPRESS_ENDPOINTS }
