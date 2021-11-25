'use strict';

const { Command } = require("../../classes/Command");

module.exports = class SettingsCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "settings",
            userPermissions: ["MANAGE_GUILD"],
            guildOnly: true
        });
    }
    async run(inter, { setting }) {

    }
}