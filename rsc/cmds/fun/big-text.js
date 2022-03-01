"use strict";

const { Command } = require("../../classes/Command");
const { LETTER_EMOTES, ZWS } = require("../../constants");

module.exports = class BigTextCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "big-text",
        });
    }
    run(inter, { text }) {
        const ltrs = [];
        for (const k of text.value) {
            ltrs.push(LETTER_EMOTES[k.toLowerCase()] ?? k);
        }
        return inter.reply(ltrs.join(ZWS));
    }
}
