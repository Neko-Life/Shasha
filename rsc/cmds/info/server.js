'use strict';

const { Command } = require("../../classes/Command");

module.exports = class ServerInfoCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "server-info",
            clientPermissions: ["EMBED_LINKS"]
        });
    }
    async run(inter, { server }) {
        console.log;
    }
}