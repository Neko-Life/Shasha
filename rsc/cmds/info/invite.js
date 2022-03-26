"use strict";

const { MessageEmbed } = require("discord.js");
const { Command } = require("../../classes/Command");
const { replyError, getColor, tickTag, infoEmbed } = require("../../functions");

module.exports = class InviteInfoCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "invite",
            description: "Show info about an invite",
        });
    }

    async run(inter, { invite }) {
        try {
            // const inv = await this.client.fetchInvite(invite.value);
            // const emb = infoEmbed(inter.user);
            console;
        } catch (e) {
            return inter.editReply(replyError(e));
        }
    }
}
