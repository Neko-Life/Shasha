"use strict";

const { Command } = require("../../classes/Command");
const DisableEnableCmd = require("../../rsc/DisableEnableCmd");

module.exports = class EnableCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "enable",
            guildOnly: true,
            userPermissions: ["MANAGE_GUILD"],
            guarded: true
        });
    }

    async run(inter, opt) {
        opt.enable = true;
        return new DisableEnableCmd(inter).run(inter, opt);
    }
}
