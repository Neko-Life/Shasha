"use strict";

const { Command } = require("../../classes/Command");

module.exports = class InviteInfoCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "invite",
            description: "Show info about an invite",
        });
    }

    async run(inter, { code }) {
        return;
        const inv = await this.client.fetchInvite(code);
    }
}
