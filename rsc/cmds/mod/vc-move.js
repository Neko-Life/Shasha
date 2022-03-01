"use strict";

const { Command } = require("../../classes/Command");
const { Moderation } = require("../../classes/Moderation");
const { replyHigherThanMod, replyError, addS } = require("../../functions");

module.exports = class VCMoveCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "vc-move",
            description: "Move member from a voice channel to another voice channel",
            clientPermissions: ["MOVE_MEMBERS"],
            userPermissions: ["MOVE_MEMBERS"],
            guildOnly: true,
        });
    }

    async run(inter, { user, channel, destination, reason = { value: "No reason provided" } } = {}) {
        if (!(user || channel))
            if (this.member.voice.channel)
                channel = { channel: this.member.voice.channel };
        if (!(user || channel)) return this.saveMessages(inter.reply("huh is there some ghost there? do i have to move em? really?"));
        await inter.deferReply();
        const force = true;
        const targets = [];
        if (user) {
            targets.push(user.user);
        }
        if (channel) targets.push(...channel.channel.members.map(r => r));
        const mod = new Moderation(this.client, {
            guild: this.guild, targets: targets, moderator: this.member, VCTarget: destination.channel,
        });
        try {
            const res = await mod.vcMove({ reason: reason.value, moderator: this.member, force });
            if (!res.moved.length) {
                const ret = this.saveMessages(replyHigherThanMod(inter, "move", res));
                if (ret[0])
                    return;
                else return this.saveMessages(inter.editReply("No one to move, move the wind will you"));
            }
            return this.saveMessages(inter.editReply(`Moved \`${res.moved.length}\` user${addS(res.moved)} to <#${destination.channel.id}>`));
        } catch (e) {
            return this.saveMessages(inter.editReply(replyError(e)));
        }

    }
}
