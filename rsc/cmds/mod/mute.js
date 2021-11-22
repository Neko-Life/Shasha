'use strict';

const { MessageEmbed } = require("discord.js");
const { Command } = require("../../classes/Command");
const { Moderation } = require("../../classes/Moderation");
const { loadDb } = require("../../database");
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
        Moderation.loadModeration(this.guild);
        const moderation = new Moderation(this.client, {
            guild: this.guild, targets: user.user, moderator: this.member
        });
        let end, durFor;
        if (duration?.value || settings.duration) {
            let ms, dur;
            if (duration.value) {
                dur = parseDuration(invoked, duration.value);
                ms = dur.interval.toDuration().toMillis();
            } else ms = settings.duration;
            if (ms < 10000) {
                return inter.editReply("I refuse to abuse the discord API just for less than 10 seconds mute <:deadLife:796323537937367050>");
            } else {
                if (dur) {
                    end = dur.end.toJSDate();
                    durFor = dur.duration.strings.join(" ");
                } else {
                    end = new Date(invoked.valueOf() + ms);
                    const D = intervalToStrings(createInterval(invoked, end));
                    durFor = D.strings.join(" ");
                }
            }
        }
        const res = await moderation.mute({ reason: reason?.value, invoked: invoked, end: end, muteRole: settings.muteRole });
        if (!res.muted.length)
            return inter.editReply("Can't mute them :(");
        const emb = new MessageEmbed()
            .setTitle("Mute")
            .setColor(getColor(this.user.accentColor, true) || getColor(this.member.displayColor, true))
            .setThumbnail(res.muted[0].user.displayAvatarURL({ size: 4096, format: "png", dynamic: true }))
            .addField("User", tickTag(res.muted[0].user.user || res.muted[0].user) + `\n(${res.muted[0].user.id})`)
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