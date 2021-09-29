'use strict';

const { Command } = require("../../classes/Command");
const { getCommunityInvite } = require("../../functions");
const configFile = require("../../../config.json");

module.exports = class SupportCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "support"
        });
    }

    async run(inter) {
        await inter.deferReply();
        const home = inter.client.guilds.cache.get(configFile.home);
        if (!home) return inter.editReply("No support server available currently");
        const inv = await getCommunityInvite(home);
        if (!inv) return inter.editReply("Failed to create invite to " + home.name);
        return inter.editReply("Need help? Wanna ask something for more details?\n"
            + "Join the [support server](" + inv.url + ")")
    }
}