"use strict";

const { Command } = require("../../classes/Command");
const CommandBanUnbanCmd = require("../../rsc/CommandBanUnbanCmd");

module.exports = class CommandUnbanCmd extends Command {
    constructor(interaction) {
        const toCommands = {
            guild: {},
            user: {}
        }
        if (interaction.client) {
            for (const k of interaction.client.bannedUsers)
                toCommands.user[k] = interaction.client.users.cache.get(k)?.tag || ("<@" + k + ">");
            for (const k of interaction.client.bannedGuilds)
                toCommands.guild[k] = interaction.client.guilds.cache.get(k)?.name || k;
        }
        super(interaction, {
            name: "commandunban",
            ownerOnly: true,
            autocomplete: {
                matchKey: true,
                commands: toCommands
            }
        });
    }

    async run(inter, { guild, user }) {
        return new CommandBanUnbanCmd(inter).run(inter, { guild, user, action: "Unban" });
    }
}
