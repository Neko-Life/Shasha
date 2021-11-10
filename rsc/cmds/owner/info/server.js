'use strict';

const { Command } = require("../../../classes/Command");
const ServerInfoCmd = require("../../info/server");

module.exports = class OwnerServerInfoCmd extends Command {
    constructor(interaction) {
        const toCommands = {
            identifier: {}
        }
        for (const [k, v] of interaction.client.guilds.cache)
            toCommands.identifier[k] = { name: v.name, value: v.id };
        super(interaction, {
            name: "ownerserverinfo",
            ownerOnly: true,
            autocomplete: {
                matchKey: true,
                commands: toCommands
            }
        });
    }
    async run(inter, { identifier }) {
        return new ServerInfoCmd(inter).run(inter, { identifier });
    }
}