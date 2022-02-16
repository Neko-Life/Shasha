"use strict";

const { MessageEmbed } = require("discord.js");
const { Command } = require("../../classes/Command");
const { Moderation } = require("../../classes/Moderation");
const { loadDb } = require("../../database");
const { logDev } = require("../../debug");
const { getColor, unixToSeconds, tickTag, replyError, replyHigherThanMod, timedPunishmentModEmbed } = require("../../functions");

module.exports = class MuteCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "mute",
            userPermissions: ["MANAGE_ROLES"],
            clientPermissions: ["MANAGE_ROLES"],
            guildOnly: true,
            deleteSavedMessagesAfter: 15000
        });
    }

    async run(inter, { user, duration, reason }) {
        if (!user) return inter.reply("unknown server pls provide fish");
        const invoked = new Date();
        await inter.deferReply();
        const gd = loadDb(this.guild, "guild/" + this.guild.id);
        const get = await gd.db.getOne("muteSettings", "Object");
        const settings = get?.value || {};
        if (!settings.muteRole)
            return this.saveMessages(inter.editReply({ content: "No mute role configured! Run `/admin settings` to set one", fetchReply: true }));
        const mod = new Moderation(this.client, {
            guild: this.guild, targets: user.user, moderator: this.member
        });
        let end, durFor;
        if (duration?.value || settings.duration) {
            try {
                const res = Moderation.defaultParseDuration(invoked, duration?.value, settings.duration);
                end = res.end;
                durFor = res.duration.strings.join(" ");
            } catch (e) {
                logDev(e);
                return this.saveMessages(inter.editReply(replyError(e)));
            }
        }
        const dST = new Date();
        const res = await mod.mute({ reason: reason?.value, invoked: invoked, end: end, muteRole: settings.muteRole });
        const dSE = new Date();
        logDev(dSE.valueOf() - dST.valueOf());
        if (!res.muted.length)
            if (replyHigherThanMod(inter, "mute", res))
                return;
        const ex = res.muted[0];
        const emb = timedPunishmentModEmbed("Mute",
            this.member,
            res.muted.map(r => r.user),
            {
                reason: res.muted[0].val.reason,
                invoked,
                end,
                durationStr: durFor,
            });
        return inter.editReply({ embeds: [emb] });
    }
}