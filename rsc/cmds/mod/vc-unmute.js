'use strict';

const { Command } = require("../../classes/Command");
const { Moderation } = require("../../classes/Moderation");
const { replyHigherThanMod } = require("../../functions");

module.exports = class VCUnmuteCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "vcunmute",
            userPermissions: ["MUTE_MEMBERS"],
            clientPermissions: ["MUTE_MEMBERS"],
            guildOnly: true,
            deleteSavedMessagesAfter: 15000
        });
    }
    async run(inter, { user, channel, reason = { value: "No reason provided" } } = {}) {
        if (!(user || channel))
            if (this.member.voice.channel)
                channel = { channel: this.member.voice.channel };
        if (!(user || channel)) return this.saveMessages(inter.reply("who you wanna marry today"));
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
            const res = await mod.vcUnmute({ reason: reason.value, moderator: this.member, force });
            if (!res.unmuted.length) {
                const ret = this.saveMessages(replyHigherThanMod(inter, "unmute", res));
                if (ret[0])
                    return;
                else return this.saveMessages(inter.editReply("no one to unmute"));
            }
            return this.saveMessages(inter.editReply(`Unmuted \`${res.unmuted.length}\` user${res.unmuted.length > 1 ? "s" : ""}`));
        } catch (e) {
            return this.saveMessages(inter.editReply(replyError(e)));
        }
    }
}