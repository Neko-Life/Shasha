"use strict";

const { Command } = require("../../classes/Command");
const { Moderation } = require("../../classes/Moderation");
const { replyHigherThanMod, replyError, addS } = require("../../functions");

module.exports = class DeafenCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "vc-deafen",
            userPermissions: ["DEAFEN_MEMBERS"],
            clientPermissions: ["DEAFEN_MEMBERS"],
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
        if (!(user || channel)) return this.saveMessages(inter.reply("wher?!? WEHERER??!?!?"));
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
            const res = await mod.vcDeafen({ reason: reason.value, moderator: this.member, force });
            if (!res.deafened.length) {
                const ret = this.saveMessages(replyHigherThanMod(inter, "deafen", res));
                if (ret[0])
                    return;
                else return this.saveMessages(inter.editReply("No one to deafen, might as well deafen yourself"));
            }
            return this.saveMessages(inter.editReply(`Deafened \`${res.deafened.length}\` user${addS(res.deafened)}`));
        } catch (e) {
            return this.saveMessages(inter.editReply(replyError(e)));
        }
    }

}
