"use strict";

const { Command } = require("../../classes/Command");

module.exports = class DieCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "die",
            description: "Die",
            ownerOnly: true,
        });
    }
    async run(inter) {
        await inter.reply("Dying");
        console.log("Exiting through command by", inter.user.tag, "at", Date().toString());
        process.exit();
    }
}