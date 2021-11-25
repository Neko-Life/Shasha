'use strict';

const { MessageEmbed } = require("discord.js");
const { Command } = require("../../classes/Command");
const { Moderation } = require("../../classes/Moderation");
const { loadDb } = require("../../database");
const { logDev } = require("../../debug");
const { getColor, unixToSeconds, tickTag } = require("../../functions");
const { parseDuration, intervalToStrings, createInterval } = require("../../util/Duration");

module.exports = class MuteCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "mute",
            userPermissions: ["MANAGE_ROLES"],
            clientPermissions: ["MANAGE_ROLES"],
            guildOnly: true
        });
    }

    async run(inter, { user, duration, reason }) {
        const invoked = new Date();
        await inter.deferReply();
        const gd = loadDb(this.guild, "guild/" + this.guild.id);
        const get = await gd.db.getOne("muteSettings", "Object");
        const settings = get?.value || {};
        if (!settings.muteRole)
            return inter.editReply("No mute role configured! Run `/admin settings` to set one");
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
                return inter.editReply("I refuse to abuse the discord API just for less than 10 seconds mute <:deadLife:796323537937367050>");
            }
        }
        const dST = new Date();
        const res = await mod.mute({ reason: reason?.value, invoked: invoked, end: end, muteRole: settings.muteRole });
        const dSE = new Date();
        logDev(dSE.valueOf() - dST.valueOf());
        if (!res.muted.length)
            if (res.higherThanClient.length)
                return inter.editReply("Can't mute someone in higher position than me");
            else if (res.higherThanModerator.length)
                return inter.editReply("You can't mute someone higher than you");
        const emb = new MessageEmbed()
            .setTitle("Mute")
            .setColor(getColor(this.user.accentColor, true) || getColor(this.member.displayColor, true))
            .setThumbnail(res.muted[0].user.displayAvatarURL({ size: 4096, format: "png", dynamic: true }))
            .addField("User", tickTag(res.muted[0].user.user || res.muted[0].user)
                + `\n<@${res.muted[0].user.id}>`
                + `\n(${res.muted[0].user.id})`)
            .addField("At", "<t:" + unixToSeconds(invoked.valueOf()) + ":F>", true)
            .setDescription(res.muted[0].val.reason);
        if (end)
            emb.addField("Until", "<t:" + unixToSeconds(end.valueOf()) + ":F>", true)
                .addField("For", "`" + durFor + "`");
        else emb.addField("Until", "`Never`", true)
            .addField("For", "`Ever`");
        return inter.editReply({ embeds: [emb] });
    }
}