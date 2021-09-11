'use strict';

const { Command } = require("../classes/Command");
const interactCmd = require("../rsc/interactCmd");

const INTERACT_ENDPOINTS = ["tickle", "kiss", "cuddle", "feed", "hug", "pat", "poke", "bite", "slap", "highfive", "stare", "wink"];
const INTERACT_TEXTS = {
    "tickle": " tickles ",
    "kiss": " kisses ",
    "cuddle": " cuddles ",
    "feed": " feeds ",
    "hug": " hugs ",
    "pat": " pats ",
    "poke": " pokes ",
    "bite": " bites ",
    "slap": " slaps ",
    "highfive": " highfives ",
    "stare": " stares at ",
    "wink": " winks at "
}
const INTERACT_DESCRIPTIONS = {
    "tickle": "Tickley tickles!",
    "kiss": "Mmmmmm",
    "cuddle": "<3",
    "feed": "Someone's hungry?",
    "hug": "Huggu <3",
    "pat": "PATS PATS PATS",
    "poke": "Poke! UwU",
    "bite": "You're hungry 0.0",
    "slap": "Oww slappers",
    "highfive": "Highfives!",
    "stare": "What you staring?",
    "wink": ";)"
}

for (const IE of INTERACT_ENDPOINTS) {
    module.exports[IE] = class extends Command {
        constructor(interaction) {
            super(interaction, {
                name: IE,
                clientPermissions: ["EMBED_LINKS"]
            });
        }

        async run(inter, { user, message }) {
            return interactCmd(inter, IE, user, INTERACT_TEXTS[IE], message?.value);
        }
    }
}

module.exports.constant = { INTERACT_ENDPOINTS, INTERACT_DESCRIPTIONS }