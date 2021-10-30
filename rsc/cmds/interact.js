'use strict';

const { Command } = require("../classes/Command");
const interactCmd = require("../rsc/interactCmd");
const { INTERACT_TEXTS } = require("../constants");

module.exports = class InteractCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "interact"
        });
    }

    async run(inter, { interaction, user, message }) {
        return interactCmd(inter, interaction.value, user, INTERACT_TEXTS[interaction.value], message?.value);
    }
}