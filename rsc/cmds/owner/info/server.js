"use strict";

const { Command } = require("../../../classes/Command");
const ServerInfoCmd = require("../../info/server");

module.exports = class OwnerServerInfoCmd extends Command {
    constructor(interaction) {
        const toCommands = {
            identifier: {}
        }
        for (const [k, v] of interaction.client?.guilds.cache || [])
            toCommands.identifier[k] = { name: v.name, value: v.id };
        super(interaction, {
            name: "owner-server-info",
            ownerOnly: true,
            autocomplete: {
                matchKey: true,
                commands: toCommands
            },
            clientPermissions: ["EMBED_LINKS", "VIEW_CHANNEL"]
        });
    }
    async run(inter, { identifier }) {
        return new ServerInfoCmd(inter).run(inter, { identifier, force: true });
    }
}
