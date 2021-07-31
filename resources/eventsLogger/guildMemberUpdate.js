'use strict';

const { GuildMember } = require("discord.js");
const { defaultEventLogEmbed, getChannel, trySend } = require("../functions");
const getColor = require("../getColor");

/**
 * @param {GuildMember} memberold 
 * @param {GuildMember} membernew 
 * @returns 
 */
module.exports = async (memberold, membernew) => {
    const NEWAV = membernew.user.displayAvatarURL({ format: "png", size: 4096, dynamic: true });
    if (!membernew.guild.DB.eventChannels?.memberRole && !membernew.guild.DB.eventChannels?.member) {
        if (membernew.user.DB.cachedAvatarURL != NEWAV) {
            membernew.user.DB.cachedAvatarURL = NEWAV;
        };
        return membernew.user.setDb("cachedAvatarURL", membernew.user.DB.cachedAvatarURL);
    }
    let log, thumbMes = "";
    const emb = defaultEventLogEmbed(membernew.guild), oldT = memberold.toJSON().displayAvatarURL;
    const oldAV = membernew.user.DB.cachedAvatarURL || oldT;
    if (oldAV) thumbMes += "This embed's thumbnail is the user's old avatar.\n";
    let audit;
    if (membernew.guild.DB.eventChannels?.memberRole) {
        log = getChannel(membernew, membernew.guild.DB.eventChannels.memberRole);
        if (membernew.guild.member(membernew.client.user).hasPermission("VIEW_AUDIT_LOG")) {
            audit = (await membernew.guild.fetchAuditLogs({ limit: 1, type: "MEMBER_ROLE_UPDATE" })).entries.first().executor;
        }
        if (membernew.roles.cache.size > memberold.roles.cache.size) {
            const use = membernew.roles.cache.difference(memberold.roles.cache).sort((a, b) => b.position - a.position).map(r => r.id);
            const use2 = memberold.roles.cache.sort((a, b) => b.position - a.position).map(r => r.id).slice(0, -1);

            emb.addField(`Role${membernew.roles.cache.size > 2 ? "s" : ""} added`,
                ("<@&" + use.slice(0, 39).join(">, <@&") + ">" + (use.length > 39 ? ` and ${use.slice(39).length} more...` : "")))

                .setDescription(`**Old role${use2.length > 2 ? "s" : ""}**\n` + (memberold.roles.cache.size > 1 ? "<@&" +
                    use2.slice(0, 82).join(">, <@&") + ">" + (use2.length > 82 ? ` and ${use2.slice(82).length} more...` : "") : "`[NONE]`"));
        }
        if (membernew.roles.cache.size < memberold.roles.cache.size) {
            const use = memberold.roles.cache.difference(membernew.roles.cache).sort((a, b) => b.position - a.position).map(r => r.id);
            const use2 = membernew.roles.cache.sort((a, b) => b.position - a.position).map(r => r.id).slice(0, -1);

            emb.addField(`Role${use.length > 2 ? "s" : ""} removed`,
                ("<@&" + use.slice(0, 39).join(">, <@&") + ">" + (use.length > 39 ? ` and ${use.slice(39).length} more...` : "")))

                .setDescription(`**Current role${membernew.roles.cache.size > 2 ? "s" : ""}**\n` + (membernew.roles.cache.size > 1 ? "<@&" +
                    use2.slice(0, 82).join(">, <@&") + ">" + (use2.length > 82 ? ` and ${use2.slice(82).length} more...` : "") : "`[NONE]`"));
        }
    }
    if (membernew.guild.DB.eventChannels?.member && membernew.roles.cache.size === memberold.roles.cache.size) {
        log = getChannel(membernew, membernew.guild.DB.eventChannels.member);
        if (membernew.displayName !== memberold.displayName) {
            if (membernew.guild.member(membernew.client.user).hasPermission("VIEW_AUDIT_LOG")) {
                audit = (await membernew.guild.fetchAuditLogs({ limit: 1, type: "MEMBER_UPDATE" })).entries.first().executor;
            }
            emb.addField("Current Nickname", "`" + membernew.displayName + "`")
                .addField("Original Nickname", "`" + memberold.displayName + "`")
        }
        if (membernew.user.DB.cachedAvatarURL !== NEWAV) {
            emb
                .setImage(NEWAV)
                .addField("Avatar", thumbMes + "The image below is the user's new avatar.");
            if (oldAV) emb.setThumbnail(oldAV);
        }
    }
    emb.setAuthor(emb.author.name, NEWAV)
        .setTitle("Profile `" + memberold.user.tag + "` updated" +
            (audit ? ` by \`${audit.tag}\`` : ""))
        .setColor(getColor("blue"));
    membernew.user.DB.cachedAvatarURL = NEWAV;
    membernew.user.setDb("cachedAvatarURL", membernew.user.DB.cachedAvatarURL);
    if (!emb.fields || emb.fields.length === 0) return;
    return trySend(membernew.client, log, emb);
}
