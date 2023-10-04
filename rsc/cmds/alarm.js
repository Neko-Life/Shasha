"use strict";

const { Command } = require("../classes/Command");

module.exports.set = class SetAlarm extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "alarm-set",
        });
    }

    /**
     * 
     * @param {import("../typins").ShaCommandInteraction} inter 
     * @param {*} param1 
     */
    async run(inter, { name, description, at, timezone = { value: "utc" } } = {}) {
        await inter.deferReply();
    }
}