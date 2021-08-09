'use strict';

const { GuildMember } = require("discord.js"),
    { DateTime, Interval } = require("luxon"),
    { getChannel, defaultEventLogEmbed, trySend, defaultDateFormat } = require("../functions"),
    getColor = require("../getColor"),
    { intervalToDuration } = require("../../cmds/moderation/src/duration");

/**
 * Log newly joined Guild Member
 * @param {GuildMember} member 
 * @returns 
 */
module.exports = async (member) => {
    if (!member.guild.DB) await member.guild.dbLoad();
    member.guild.updateCached("systemChannelID", member.guild.systemChannelID);
    member.guild.updateCached("iconURL", member.guild.iconURL({ size: 4096, format: "png", dynamic: true }));
    if (!member.DB) await member.dbLoad();
    if (member.DB.leaveRoles?.length && member.guild.me.hasPermission("MANAGE_ROLES")) {
        await member.roles.add(member.DB.leaveRoles, "Automatic roles recovery").then(() => console.log("AUTO ROLES RECOVERY:",
            member.user.tag, member.guild.name)).catch(() => { });
        await member.setDb("leaveRoles", []);
    }
    if (member.guild.DB.eventChannels?.join) {
        const log = getChannel(member, member.guild.DB.eventChannels.join);
        if (!log) return;
        const emb = defaultEventLogEmbed(member.guild),
            INT2 = Interval.fromDateTimes(DateTime.fromJSDate(member.user.createdAt), DateTime.now());
        emb
            .setTitle((member.user.bot ? "`[BOT]` " : "") + "`" + member.user.tag + "` joined")
            .setThumbnail(member.user.displayAvatarURL({ format: "png", size: 4096, dynamic: true }))
            .setColor(getColor("cyan"))
            .addField("Registered", defaultDateFormat(member.user.createdAt) +
                `\n(${intervalToDuration(INT2).strings.join(" ")} ago)`)
            .setDescription(`<@!${member.id}> (${member.id}) just joined.\nWe have ${member.guild.memberCount} total members now.`);
        return trySend(member.client, log, emb);
    }
}