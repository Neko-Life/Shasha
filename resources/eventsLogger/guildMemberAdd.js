'use strict';

const { GuildMember } = require("discord.js");
const { getChannelProchedure, defaultEventLogEmbed, trySend } = require("../functions");
const getColor = require("../getColor");

/**
 * Log newly joined Guild Member
 * @param {GuildMember} member 
 * @returns 
 */
module.exports = (member) => {
    if (member.guild.eventChannels?.joinLeave) {
        const log = getChannelProchedure(member, member.guild.eventChannels.joinLeave);
        if (!log) return;
        const emb = defaultEventLogEmbed(member.guild);
        emb
        .setTitle("User `" + member.user.tag + "` joined")
        .setThumbnail(member.user.displayAvatarURL({format: "png", size: 4096, dynamic: true}))
        .setColor(getColor("cyan"))
        .addField("Registered", "**" + new Date(member.user.createdAt).toUTCString().slice(0, -4) + "**", true)
        .setDescription(`<@!${member.id}> (${member.id}) just joined.\nWe have ${member.guild.memberCount} total members now.`);
        return trySend(member.client, log, emb);
    }
}