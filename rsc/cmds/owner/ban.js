'use strict';

const { Command } = require("../../classes/Command");
const CommandBanUnbanCmd = require("../../rsc/CommandBanUnbanCmd");

module.exports = class CommandBanCmd extends Command {
    constructor(interaction) {
        const toCommands = {
            guild: {},
            user: {}
        }
        for (const [k, v] of interaction.client.guilds.cache)
            toCommands.guild[k] = { name: v.name, value: v.id };
        for (const [k, v] of interaction.client.users.cache)
            toCommands.user[k] = { name: v.tag, value: v.id };
        super(interaction, {
            name: "commandban",
            ownerOnly: true,
            autocomplete: {
                matchKey: true,
                commands: toCommands
            }
        });
    }

    async run(inter, { guild, user }) {
        return new CommandBanUnbanCmd(inter).run(inter, { guild, user, action: "Ban" });
    }
}