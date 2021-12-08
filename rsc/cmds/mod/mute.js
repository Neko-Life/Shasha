'use strict';

const { MessageEmbed } = require("discord.js");
const { Command } = require("../../classes/Command");
const { Moderation } = require("../../classes/Moderation");
const { loadDb } = require("../../database");
const { logDev } = require("../../debug");
const { getColor, unixToSeconds, tickTag, replyError, replyHigherThanMod } = require("../../functions");

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
        const emb = new MessageEmbed()
            .setTitle("Mute")
            .setColor(getColor(this.user.accentColor, true, this.member.displayColor))
            .setThumbnail(ex.user.displayAvatarURL({ size: 4096, format: "png", dynamic: true }))
            .addField("User", tickTag(ex.user.user || ex.user)
                + `\n<@${ex.user.id}>`
                + `\n(${ex.user.id})`)
            .addField("At", "<t:" + unixToSeconds(invoked) + ":F>", true)
            .setDescription(ex.val.reason);
        if (end)
            emb.addField("Until", "<t:" + unixToSeconds(end) + ":F>", true)
                .addField("For", "`" + durFor + "`");
        else emb.addField("Until", "`Never`", true)
            .addField("For", "`Ever`");
        return inter.editReply({ embeds: [emb] });
    }
}