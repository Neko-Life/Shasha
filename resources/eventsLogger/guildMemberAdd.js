'use strict';

const { GuildMember } = require("discord.js"),
    { DateTime } = require("luxon"),
    { getChannel, defaultEventLogEmbed, trySend } = require("../functions"),
    getColor = require("../getColor"),
    { DT_PRINT_FORMAT } = require("../../cmds/moderation/src/duration");

/**
 * Log newly joined Guild Member
 * @param {GuildMember} member 
 * @returns 
 */
module.exports = (member) => {
    if (member.guild.DB.settings.eventChannels?.join) {
        const log = getChannel(member, member.guild.DB.settings.eventChannels.join);
        if (!log) return;
        const emb = defaultEventLogEmbed(member.guild);
        emb
            .setTitle("`" + member.user.tag + "` joined")
            .setThumbnail(member.user.displayAvatarURL({ format: "png", size: 4096, dynamic: true }))
            .setColor(getColor("cyan"))
            .addField("Registered", DateTime.fromJSDate(member.user.createdAt).toFormat(DT_PRINT_FORMAT), true)
            .setDescription(`<@!${member.id}> (${member.id}) just joined.\nWe have ${member.guild.memberCount} total members now.`);
        return trySend(member.client, log, emb);
    }
}