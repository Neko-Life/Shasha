'use strict';

const { GuildMember } = require("discord.js");
const { getChannel, defaultEventLogEmbed, trySend, splitOnLength } = require("../functions");
const getColor = require("../getColor");

/**
 * 
 * @param {GuildMember} member 
 * @returns 
 */
module.exports = (member) => {
    if (member.guild.eventChannels?.leave) {
        const log = getChannel(member, member.guild.eventChannels.leave);
        if (!log) return;
        const days = Math.floor(new Date(new Date().valueOf() + member.client.matchTimestamp - member.joinedAt.valueOf()).valueOf() / 86400000),
            emb = defaultEventLogEmbed(member.guild);
        const RO = member.roles.cache.sort((a, b) => b.position - a.position).map(r => r.id).slice(0, -1),
            RU = splitOnLength(RO, 1010, ">, <@&");
        emb
            .setTitle("Member `" + member.user.tag + "` left")
            .setThumbnail(member.user.displayAvatarURL({ format: "png", size: 4096, dynamic: true }))
            .setColor(getColor("yellow"))
            .addField("Registered", "**" + member.user.createdAt.toUTCString().slice(0, -4) + "**", true)
            .addField("Joined", "**" + member.joinedAt.toUTCString().slice(0, -4) + "**" + `\n(${days > 0 ? `${days} day${days > 1 ? "s" : ""} ago` : "Today"})`, true)
            .addField("Nick", "`" + member.displayName + "`")
            .setDescription(`<@!${member.id}> (${member.id}) just left.\nWe have ${member.guild.memberCount} total members now.`);
        for (const U of RU) {
            emb.addField(emb.fields.length === 3 ? "Roles" : "", U.length > 0 ? "<@&" + U.join(">, <@&") + ">" : "`[NONE]`");
        }
        return trySend(member.client, log, emb);
    }
}