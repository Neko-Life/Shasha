"use strict";

const { Command } = require("../../classes/Command");
const { Moderation } = require("../../classes/Moderation");
const { replyHigherThanMod, addS } = require("../../functions");

module.exports = class VCUndeafenCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "vc-undeafen",
            userPermissions: ["DEAFEN_MEMBERS"],
            clientPermissions: ["DEAFEN_MEMBERS"],
            guildOnly: true,
            deleteSavedMessagesAfter: 15000
        });
    }
    async run(inter, { user, channel, reason = { value: "No reason provided" } } = {}) {
        if (!(user || channel))
            if (this.member.voice.channel)
                channel = { channel: this.member.voice.channel };
        if (!(user || channel)) return this.saveMessages(inter.reply("which channel's population you wanna multiply for"));
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
            const res = await mod.vcUndeafen({ reason: reason.value, moderator: this.member, force });
            if (!res.undeafened.length) {
                const ret = this.saveMessages(replyHigherThanMod(inter, "undeafen", res));
                if (ret[0])
                    return;
                else return this.saveMessages(inter.editReply("Nobody deafened"));
            }
            return this.saveMessages(inter.editReply(`Undeafened \`${res.undeafened.length}\` user${addS(res.undeafened)}`));
        } catch (e) {
            return this.saveMessages(inter.editReply(replyError(e)));
        }
    }
}
