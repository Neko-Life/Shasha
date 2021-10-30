'use strict';

const { Command } = require("../../classes/Command");
const CommandBanUnbanCmd = require("../../rsc/CommandBanUnbanCmd");

module.exports = class CommandBanCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "commandban",
            ownerOnly: true
        });
    }

    async run(inter, { guild, user }) {
        return new CommandBanUnbanCmd(inter).run(inter, { guild, user, action: "Ban" });
    }
}