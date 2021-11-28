'use strict';

const { Command } = require("../../classes/Command");
const { tickTag } = require("../../functions");

module.exports = class DeafenCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "deafen",
            userPermissions: ["DEAFEN_MEMBERS"],
            clientPermissions: ["DEAFEN_MEMBERS"],
            guildOnly: true
        });
    }
    /**
     * 
     * @param {*} inter 
     * @param {{user:{member:import("../../typins").ShaGuildMember}}} param1
     */
    async run(inter, { user, channel, duration, reason }) {
        if (!(user || channel)) return inter.reply("Provide voice channel or user to deafen!");
    }
}