"use strict";

const { Command } = require("../../classes/Command");

const answers = ["Non't", "Obviously no", "Hell no", "Hell yes", "Hell yeah", "Can't be", "Yes", "No", "Maybe", "Obviously", "No way", "Impossible", "Possibly", "69% sure", "Mhm", "Not sure", "Perhaps", "Can be", "Of course", "Yesn't"]

module.exports = class Ask8ballCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "8ball"
        });
    }

    run(inter, { question }) {
        if (!question) return inter.reply("Just ask my child, don't be afraid");
        return inter.reply(answers[Math.floor(Math.random() * answers.length)]);
    }
}
