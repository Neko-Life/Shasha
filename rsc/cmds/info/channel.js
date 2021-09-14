'use strict';

const { Command } = require("../../classes/Command");

module.exports = class ChannelInfoCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "channel",
            clientPermissions: ["EMBED_LINKS"]
        });
    }

    async run(inter, { channel }) {
        if (!channel) channel = inter.channel;
        else channel = channel.channel;
        console.log;
    }
}