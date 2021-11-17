'use strict';

const { Command } = require("../../classes/Command");

module.exports = class LockdownCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "lockdown",
            clientPermissions: ["MANAGE_CHANNELS"],
            userPermissions: ["MANAGE_CHANNELS"],
            guildOnly: true
        });
    }
    async run(inter, { channel, bypassRoles, bypassUsers, bypassPermissions }) {

    }
}