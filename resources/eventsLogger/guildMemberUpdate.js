'use strict';

const { GuildMember } = require("discord.js");
const { defaultEventLogEmbed, getChannel, trySend } = require("../functions");
const getColor = require("../getColor");

/**
 * @param {GuildMember} memberold 
 * @param {GuildMember} membernew 
 * @returns 
 */
module.exports = (memberold, membernew) => {
    if (!membernew.guild.DB.eventChannels?.memberRole && !membernew.guild.DB.eventChannels?.member) {
        if (membernew.user.DB.cachedAvatarURL != membernew.user.displayAvatarURL({ format: "png", size: 4096, dynamic: true })) {
            membernew.user.DB.cachedAvatarURL = membernew.user.displayAvatarURL({ format: "png", size: 4096, dynamic: true });
        };
        return membernew.user.setDb(membernew.user.DB);
    }
    let log, thumbMes = "";
    const emb = defaultEventLogEmbed(membernew.guild), oldT = memberold.toJSON().displayAvatarURL;
    const oldAV = membernew.user.DB.cachedAvatarURL || oldT;
    emb.setTitle("Profile `" + memberold.user.tag + "` updated")
        .setColor(getColor("blue"));
    if (oldAV) thumbMes += "This embed's thumbnail is the user's old avatar.\n";
    if (membernew.guild.DB.eventChannels?.memberRole) {
        log = getChannel(membernew, membernew.guild.DB.eventChannels.memberRole);
        if (membernew.roles.cache.size > memberold.roles.cache.size) {
            emb.addField("Role added", ("<@&" + membernew.roles.cache.difference(memberold.roles.cache).sort((a, b) => b.position - a.position).map(r => r.id).join(">, <@&") + ">").slice(0, 2048))
                .setDescription("**Old roles**\n" + (memberold.roles.cache.size > 1 ? "<@&" + memberold.roles.cache.sort((a, b) => b.position - a.position).map(r => r.id).slice(0, -1).join(">, <@&") + ">" : "`[NONE]`"));
        }
        if (membernew.roles.cache.size < memberold.roles.cache.size) {
            emb.addField("Role removed", ("<@&" + memberold.roles.cache.difference(membernew.roles.cache).sort((a, b) => b.position - a.position).map(r => r.id).join(">, <@&") + ">").slice(0, 2048))
                .setDescription("**Current roles**\n" + (membernew.roles.cache.size > 1 ? "<@&" + membernew.roles.cache.sort((a, b) => b.position - a.position).map(r => r.id).slice(0, -1).join(">, <@&") + ">" : "`[NONE]`"));
        }
    }
    if (membernew.guild.DB.eventChannels?.member && membernew.roles.cache.size === memberold.roles.cache.size) {
        log = getChannel(membernew, membernew.guild.DB.eventChannels.member);
        if (membernew.displayName !== memberold.displayName) {
            emb.addField("Nickname", "Changed from `" + memberold.displayName + "` to `" + membernew.displayName + "`");
        }
        if (membernew.user.DB.cachedAvatarURL !== membernew.user.displayAvatarURL({ format: "png", size: 4096, dynamic: true })) {
            emb
                .setImage(membernew.user.displayAvatarURL({ format: "png", size: 4096, dynamic: true }))
                .addField("Avatar", thumbMes + "The image below is the user's new avatar.");
            if (oldAV) emb.setThumbnail(oldAV);
        }
    }
    membernew.user.DB.cachedAvatarURL = membernew.user.displayAvatarURL({ format: "png", size: 4096, dynamic: true });
    membernew.user.setDb(membernew.user.DB);
    if (!emb.fields || emb.fields.length === 0) return;
    return trySend(membernew.client, log, emb);
}
