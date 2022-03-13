"use strict";

const { Command } = require("../../classes/Command");
const expressCmd = require("../../rsc/expressCmd");

module.exports = class NekoCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "kitsune"
        });
    }

    async run(inter) {
        return expressCmd(inter, "kitsune", " rawrr~");
    }
}
