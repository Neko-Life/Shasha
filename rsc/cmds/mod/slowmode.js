"use strict";

const { CommandInteraction } = require("discord.js");
const { Interval } = require("luxon");
const { Command } = require("../../classes/Command");
const { unixToSeconds, replyError } = require("../../functions");
const { parseDuration, intervalToStrings } = require("../../util/Duration");

module.exports = class SlowmodeCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "slowmode",
            userPermissions: ["MANAGE_CHANNELS"],
            clientPermissions: ["MANAGE_CHANNELS"]
        });
    }
    /**
     * 
     * @param {CommandInteraction} inter
     * @param {{channel:{channel:import("discord.js").TextChannel}}} param1 
     */
    async run(inter, { channel, duration, reason }) {
        const invoked = new Date();
        if (!channel) channel = { channel: this.channel };
        try {
            const parsed = parseDuration(invoked, duration.value);
            let seconds = parsed.duration?.ms ? unixToSeconds(parsed.duration.ms) : 0;
            if (seconds > 21600) seconds = 21600;
            const newC = await channel.channel.setRateLimitPerUser(seconds, reason?.value);
            return inter.reply(newC.rateLimitPerUser ? `Set slowmode of ${intervalToStrings(Interval.after(new Date(), newC.rateLimitPerUser * 1000)).strings.join(" ")} for <#${channel.channel.id}>` : `Disabled slowmode for <#${channel.channel.id}>`);
        } catch (e) {
            return inter.reply(replyError(e));
        }
    }
}