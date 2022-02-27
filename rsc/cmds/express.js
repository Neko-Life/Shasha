"use strict";

const { Command } = require("../classes/Command");
const expressCmd = require("../rsc/expressCmd");
const { EXPRESS_TEXTS } = require("../constants");

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
