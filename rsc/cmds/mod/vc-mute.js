"use strict";

const { Command } = require("../../classes/Command");
const { Moderation } = require("../../classes/Moderation");
const { replyHigherThanMod } = require("../../functions");

module.exports = class VCMuteCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "vcmute",
            userPermissions: ["MUTE_MEMBERS"],
            clientPermissions: ["MUTE_MEMBERS"],
            guildOnly: true,
            deleteSavedMessagesAfter: 15000
        });
    }
    /**
     * 
     * @param {*} inter 
     * @param {{user:{member:import("../../typins").ShaGuildMember}}} param1
     */
    async run(inter, { user, channel, reason = { value: "No reason provided" } } = {}) {
        if (!(user || channel))
            if (this.member.voice.channel)
                channel = { channel: this.member.voice.channel };
        if (!(user || channel)) return this.saveMessages(inter.reply("Nothin to mute ima mute you instead"));
        await inter.deferReply();
        let force = false;
        const targets = [];
        if (user) {
            targets.push(user.user);
            force = true;
        }
        if (channel) targets.push(...channel.channel.members.map(r => r));
        const mod = new Moderation(this.client, {
            guild: this.guild, targets: targets, moderator: this.member
        });
        try {
            const res = await mod.vcMute({ reason: reason.value, moderator: this.member, force });
            if (!res.muted.length) {
                const ret = this.saveMessages(replyHigherThanMod(inter, "mute", res));
                if (ret[0])
                    return;
                else return this.saveMessages(inter.editReply("No one to mute, might as well mute yourself"));
            }
            return this.saveMessages(inter.editReply(`Muted \`${res.muted.length}\` user${res.muted.length > 1 ? "s" : ""}`));
        } catch (e) {
            return this.saveMessages(inter.editReply(replyError(e)));
        }
    }

}
