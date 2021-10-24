'use strict';

const { Command } = require("../classes/Command");
const expressCmd = require("../rsc/expressCmd");

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
            name: "express"
        });
    }

    async run(inter, { expression, message }) {
        return expressCmd(inter, expression.value, EXPRESS_TEXTS[expression.value], message?.value);
    }
}