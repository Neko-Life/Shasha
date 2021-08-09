'use strict';

const { GuildMember } = require("discord.js");
const { DateTime, Interval, Settings } = require("luxon");
const { intervalToDuration } = require("../../cmds/moderation/src/duration");
const { getChannel, defaultEventLogEmbed, trySend, splitOnLength, defaultDateFormat } = require("../functions");
const getColor = require("../getColor");
Settings.defaultZone = "utc";

/**
 * @param {GuildMember} member 
 * @returns 
 */
module.exports = async (member) => {
    if (!member.guild.DB) await member.guild.dbLoad();
    member.guild.updateCached("systemChannelID", member.guild.systemChannelID);
    member.guild.updateCached("iconURL", member.guild.iconURL({ size: 4096, format: "png", dynamic: true }));
    const RO = member.roles.cache.sort((a, b) => b.position - a.position).map(r => r.id).slice(0, -1);
    if (member.guild.DB.eventChannels?.leave) {
        const log = getChannel(member, member.guild.DB.eventChannels.leave);
        if (!log) return;
        const emb = defaultEventLogEmbed(member.guild),
            RU = splitOnLength(RO, 1010, ">, <@&"),
            LE = DateTime.fromJSDate(member.joinedAt),
            INT = Interval.fromDateTimes(LE, DateTime.now());

        emb
            .setTitle((member.user.bot ? "`[BOT]` " : "") + "`" + member.user.tag + "` left")
            .setThumbnail(member.user.displayAvatarURL({ format: "png", size: 4096, dynamic: true }))
            .setColor(getColor("yellow"))
            .addField("Nick", "`" + member.displayName + "`")
            .addField("Joined", defaultDateFormat(member.joinedAt) + `\n(${intervalToDuration(INT).strings.join(" ")} ago)`)
            .setDescription(`<@!${member.id}> (${member.id}) just left.\nWe have ${member.guild.memberCount} total members now.`);
        for (const U of RU) {
            emb.addField(emb.fields.length === 2 ? "Roles" : "​", U.length ? "<@&" + U.join(">, <@&") + ">" : "`[NONE]`");
        }
        return trySend(member.client, log, emb);
    }
    await member.setLeaveRoles(RO);
}