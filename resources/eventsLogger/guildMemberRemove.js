'use strict';

const { GuildMember } = require("discord.js");
const { DateTime, Interval, Settings } = require("luxon");
const { DT_PRINT_FORMAT, intervalToDuration } = require("../../cmds/moderation/src/duration");
const { getChannel, defaultEventLogEmbed, trySend, splitOnLength } = require("../functions");
const getColor = require("../getColor");
Settings.defaultZone = "utc";

/**
 * @param {GuildMember} member 
 * @returns 
 */
module.exports = (member) => {
    if (member.guild.DB.settings.eventChannels?.leave) {
        const log = getChannel(member, member.guild.DB.settings.eventChannels.leave);
        if (!log) return;
        const days = intervalToDuration(Interval.fromDateTimes(DateTime.fromJSDate(member.joinedAt), DateTime.now())).strings.join(" "),
            emb = defaultEventLogEmbed(member.guild),
            RO = member.roles.cache.sort((a, b) => b.position - a.position).map(r => r.id).slice(0, -1),
            RU = splitOnLength(RO, 1010, ">, <@&");
        emb
            .setTitle("`" + member.user.tag + "` left")
            .setThumbnail(member.user.displayAvatarURL({ format: "png", size: 4096, dynamic: true }))
            .setColor(getColor("yellow"))
            .addField("Registered", "**" + DateTime.fromJSDate(member.user.createdAt).toFormat(DT_PRINT_FORMAT) + "**", true)
            .addField("Joined", "**" + DateTime.fromJSDate(member.joinedAt).toFormat(DT_PRINT_FORMAT) + "**" + `\n(${days > 0 ? `${days} day${days > 1 ? "s" : ""} ago` : "Today"})`, true)
            .addField("Nick", "`" + member.displayName + "`")
            .setDescription(`<@!${member.id}> (${member.id}) just left.\nWe have ${member.guild.memberCount} total members now.`);
        for (const U of RU) {
            emb.addField(emb.fields.length === 3 ? "Roles" : "", U.length > 0 ? "<@&" + U.join(">, <@&") + ">" : "`[NONE]`");
        }
        return trySend(member.client, log, emb);
    }
}