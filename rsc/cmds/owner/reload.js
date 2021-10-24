'use strict';

const { Command } = require("../../classes/Command");

module.exports = class ReloadCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "reload",
            ownerOnly: true
        });
    }

    async run(inter) {
        await inter.deferReply();
        inter.client.dispatch();
        return inter.editReply("Okkiie thank chu ❤️❤️");
    }
}