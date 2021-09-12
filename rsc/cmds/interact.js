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

module.exports = class InteractCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "interact",
            clientPermissions: ["EMBED_LINKS"]
        });
    }

    async run(inter, { interaction, user, message }) {
        return interactCmd(inter, interaction.value, user, INTERACT_TEXTS[interaction.value], message?.value);
    }
}

module.exports.constant = { INTERACT_ENDPOINTS }