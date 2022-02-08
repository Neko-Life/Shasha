"use strict";

const { Command } = require("../../classes/Command");
const DisableEnableCmd = require("../../rsc/DisableEnableCmd");

module.exports = class DisableCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "disable",
            guildOnly: true,
            userPermissions: ["MANAGE_GUILD"],
            guarded: true
        });
    }

    async run(inter, opt) {
        return new DisableEnableCmd(inter).run(inter, opt);
    }
}