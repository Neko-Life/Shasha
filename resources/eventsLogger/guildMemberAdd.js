'use strict';

const { GuildMember } = require("discord.js");
const { getChannel, defaultEventLogEmbed, trySend } = require("../functions");
const getColor = require("../getColor");

/**
 * Log newly joined Guild Member
 * @param {GuildMember} member 
 * @returns 
 */
module.exports = (member) => {
    if (member.guild.eventChannels?.join) {
        const log = getChannel(member, member.guild.eventChannels.join);
        if (!log) return;
        const emb = defaultEventLogEmbed(member.guild);
        emb
            .setTitle("`" + member.user.tag + "` joined")
            .setThumbnail(member.user.displayAvatarURL({ format: "png", size: 4096, dynamic: true }))
            .setColor(getColor("cyan"))
            .addField("Registered", "**" + member.user.createdAt.toUTCString().slice(0, -4) + "**", true)
            .setDescription(`<@!${member.id}> (${member.id}) just joined.\nWe have ${member.guild.memberCount} total members now.`);
        return trySend(member.client, log, emb);
    }
}