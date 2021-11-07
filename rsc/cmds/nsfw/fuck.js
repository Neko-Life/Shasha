'use strict';

const { Command } = require("../../classes/Command");
const { NSFW_INTERACT } = require("../../constants");
const interactCmd = require("../../rsc/interactCmd");

module.exports = class FuckCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "fuck",
            description: "Fuck",
            nsfwOnly: true
        });
    }
    async run(inter, { partner, message }) {
        return interactCmd(inter, NSFW_INTERACT.find(r => r.name === this.name), partner, " fucks ", message?.value, false, "lewds");
    }
}