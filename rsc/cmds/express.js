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
const EXPRESS_DESCRIPTIONS = {
    "smile": "Show your smile!",
    "smug": "Show your little smug face!",
    "laugh": "Lets laugh!",
    "baka": "They're a baka!",
    "cry": ":c",
    "dance": "Lets danceey",
    "wave": "Wave to your friends!",
    "blush": "Show how flustered you are 😳",
    "bored": "Show your boredom",
    "facepalm": "Duhh",
    "happy": "Be happy!",
    "pout": "I'm also upset!",
    "shrug": "Shrug it off",
    "sleep": "You sleep?",
    "think": "Have a thought",
    "thumbsup": "Agree with some genius in the chat"
}

for (const EP of EXPRESS_ENDPOINTS) {
    module.exports[EP] = class extends Command {
        constructor(interaction) {
            super(interaction, {
                name: EP,
                clientPermissions: ["EMBED_LINKS"]
            });
        }

        async run(inter, { message }) {
            return expressCmd(inter, EP, EXPRESS_TEXTS[EP], message?.value);
        }
    }
}

module.exports.constant = { EXPRESS_DESCRIPTIONS, EXPRESS_ENDPOINTS }