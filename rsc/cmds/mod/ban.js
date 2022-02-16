"use strict";

const { MessageEmbed } = require("discord.js");
const { Command } = require("../../classes/Command");
const { Moderation } = require("../../classes/Moderation");
const { loadDb } = require("../../database");
const { logDev } = require("../../debug");
const { getColor, unixToSeconds, tickTag, replyError, replyHigherThanMod } = require("../../functions");

module.exports = class BanCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "ban",
            userPermissions: ["BAN_MEMBERS"],
            clientPermissions: ["BAN_MEMBERS"],
            guildOnly: true
        });
    }

    async run(inter, { user, duration, purge, reason }) {
        if (!user) return inter.reply("beep bo~~op**E~~rr**or _can'_tp__ut a__t _rest 404gf `not:`:found");
        const invoked = new Date();
        await inter.deferReply();
        const gd = loadDb(this.guild, "guild/" + this.guild.id);
        const get = await gd.db.getOne("banSettings", "Object");
        const settings = get?.value || {};

        const mod = new Moderation(this.client, {
            guild: this.guild, targets: user.user, moderator: this.member
        });

        const purgeDay = purge ? parseInt(purge.value) : settings.purge;

        let end, durFor;
        if (duration?.value || settings.duration) {
            try {
                const res = Moderation.defaultParseDuration(invoked, duration?.value, settings.duration);
                end = res.end;
                durFor = res.duration.strings.join(" ");
            } catch (e) {
                logDev(e);
                return inter.editReply(replyError(e));
            }
        }
        const dST = new Date();
        const res = await mod.ban({ reason: reason?.value, invoked: invoked, end: end, days: purgeDay || undefined });
        const dSE = new Date();
        logDev(dSE.valueOf() - dST.valueOf());
        if (!res.banned.length)
            if (replyHigherThanMod(inter, "ban", res))
                return;
        const ex = res.banned[0];
        const emb = new MessageEmbed()
            .setTitle("Ban")
            .setColor(getColor(this.user.accentColor, true, this.member.displayColor))
            .setThumbnail(ex.user.displayAvatarURL({ size: 4096, format: "png", dynamic: true }))
            .addField("User", tickTag(ex.user.user || ex.user)
                + `\n<@${ex.user.id}>`
                + `\n(${ex.user.id})`)
            .addField("At", "<t:" + unixToSeconds(invoked) + ":F>", true)
            .setDescription(ex.opt.reason);
        if (end)
            emb.addField("Until", "<t:" + unixToSeconds(end) + ":F>", true)
                .addField("For", "`" + durFor + "`");
        else emb.addField("Until", "`Never`", true)
            .addField("For", "`Ever`");
        if (ex.opt.days)
            emb.addField("Purged", "`Up to " + ex.opt.days + ` day${ex.opt.days > 1 ? "s" : ""} old messages from now\``)
        return inter.editReply({ embeds: [emb] });
    }
}