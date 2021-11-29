'use strict';

const { MessageEmbed } = require("discord.js");
const { Command } = require("../../classes/Command");
const { Moderation } = require("../../classes/Moderation");
const { loadDb } = require("../../database");
const { logDev } = require("../../debug");
const { getColor, unixToSeconds, tickTag, replyError } = require("../../functions");

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
            if (res.higherThanClient.length)
                return inter.editReply("Can't ban someone in the same or higher position than me");
            else if (res.higherThanModerator.length)
                return inter.editReply("You can't ban someone in the same or higher position than you");
        const emb = new MessageEmbed()
            .setTitle("Ban")
            .setColor(getColor(this.user.accentColor, true) || getColor(this.member.displayColor, true))
            .setThumbnail(res.banned[0].user.displayAvatarURL({ size: 4096, format: "png", dynamic: true }))
            .addField("User", tickTag(res.banned[0].user.user || res.banned[0].user)
                + `\n<@${res.banned[0].user.id}>`
                + `\n(${res.banned[0].user.id})`)
            .addField("At", "<t:" + unixToSeconds(invoked.valueOf()) + ":F>", true)
            .setDescription(res.banned[0].opt.reason);
        if (end)
            emb.addField("Until", "<t:" + unixToSeconds(end.valueOf()) + ":F>", true)
                .addField("For", "`" + durFor + "`");
        else emb.addField("Until", "`Never`", true)
            .addField("For", "`Ever`");
        if (res.banned[0].opt.days)
            emb.addField("Purged", "`Up to " + res.banned[0].opt.days + ` day${res.banned[0].opt.days > 1 ? "s" : ""} old messages from now\``)
        return inter.editReply({ embeds: [emb] });
    }
}