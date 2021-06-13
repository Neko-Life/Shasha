'use strict';

const { GuildMember } = require("discord.js");
const { defaultEventLogEmbed, getChannelProchedure, trySend } = require("../functions");
const getColor = require("../getColor");

/**
 * 
 * @param {GuildMember} memberold 
 * @param {GuildMember} membernew 
 * @returns 
 */
module.exports = (memberold, membernew) => {
    if (membernew.guild.eventChannels?.memberRole === undefined && membernew.guild.eventChannels?.member === undefined) {
        if (membernew.user.cachedAvatarURL != membernew.user.displayAvatarURL({format: "png", size: 4096, dynamic: true})) {
            membernew.user.cachedAvatarURL = membernew.user.displayAvatarURL({format: "png", size: 4096, dynamic: true});
        };
        return;
    }
    let log;
    const emb = defaultEventLogEmbed(membernew.guild);
    emb.setTitle("Profile `" + memberold.user.tag + "` updated")
    .setThumbnail(membernew.user.cachedAvatarURL ?? memberold.toJSON().displayAvatarURL)
    .setColor(getColor("blue"));
    if (membernew.guild.eventChannels?.memberRole) {
        log = getChannelProchedure(membernew, membernew.guild.eventChannels.memberRole);
        if (membernew.roles.cache.size > memberold.roles.cache.size) {
            emb.addField("Role added", "<@&" + membernew.roles.cache.difference(memberold.roles.cache).sort((a, b) => b.position - a.position).map(r => r.id).join(">, <@&") + ">")
            .addField("Old roles", memberold.roles.cache.size > 1 ? "<@&" + memberold.roles.cache.sort((a, b) => b.position - a.position).map(r => r.id).slice(0, -1).join(">, <@&") + ">" : "`[NONE]");
        }
        if (membernew.roles.cache.size < memberold.roles.cache.size) {
            emb.addField("Role removed", "<@&" + memberold.roles.cache.difference(membernew.roles.cache).sort((a, b) => b.position - a.position).map(r => r.id).join(">, <@&") + ">")
            .addField("Current roles", membernew.roles.cache.size > 1 ? "<@&" + membernew.roles.cache.sort((a, b) => b.position - a.position).map(r => r.id).slice(0, -1).join(">, <@&") + ">" : "`[NONE]");
        }
    }
    if (membernew.guild.eventChannels?.member && membernew.roles.cache.size === memberold.roles.cache.size) {
        log = getChannelProchedure(membernew, membernew.guild.eventChannels.member);
        if (membernew.displayName != memberold.displayName) {
            emb.addField("Nickname", "Changed from `" + memberold.displayName + "` to `" + membernew.displayName + "`");
        }
        if (membernew.user.cachedAvatarURL != membernew.user.displayAvatarURL({format: "png", size: 4096, dynamic: true})) {
            emb
            .setImage(membernew.user.displayAvatarURL({format: "png", size: 4096, dynamic: true}))
            .addField("Avatar", (emb.thumbnail ? "This embed's thumbnail is the user's old avatar.\n" : "") + "The image below is the user's new avatar.");
        }
    }
    if (membernew.user.cachedAvatarURL != membernew.user.displayAvatarURL({format: "png", size: 4096, dynamic: true})) {
        membernew.user.cachedAvatarURL = membernew.user.displayAvatarURL({format: "png", size: 4096, dynamic: true});
    };
    return trySend(membernew.client, log, emb);
}
