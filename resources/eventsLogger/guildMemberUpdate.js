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
    if (!membernew.guild.DB) await membernew.guild.dbLoad();
    membernew.guild.updateCached("systemChannelID", membernew.guild.systemChannelID);
    membernew.guild.updateCached("iconURL", membernew.guild.iconURL({ size: 4096, format: "png", dynamic: true }));
    const NEWAV = membernew.user.displayAvatarURL({ format: "png", size: 4096, dynamic: true });
    if (!membernew.guild.DB.eventChannels?.memberRole && !membernew.guild.DB.eventChannels?.member) {
        if (membernew.user.DB.cachedAvatarURL != NEWAV) {
            membernew.user.DB.cachedAvatarURL = NEWAV;
        };
        return membernew.user.setDb("cachedAvatarURL", membernew.user.DB.cachedAvatarURL);
    }
    let log, thumbMes = "", audit = {}, auditPerm, nullReason = false, dateNow = new Date();
    const emb = defaultEventLogEmbed(membernew.guild), oldT = memberold.toJSON().displayAvatarURL;
    const oldAV = membernew.user.DB.cachedAvatarURL || oldT;
    if (oldAV) thumbMes += "This embed's thumbnail is the user's old avatar.\n";
    if (membernew.guild.DB.eventChannels?.memberRole) {
        log = getChannel(membernew, membernew.guild.DB.eventChannels.memberRole);
        if (membernew.guild.me.hasPermission("VIEW_AUDIT_LOG")) {
            // console.log("FETCH UPDATE LOG", membernew.user.tag);
            const the = (await membernew.guild.fetchAuditLogs({ limit: 1, type: "MEMBER_ROLE_UPDATE" })).entries.first();
            if (the.target.id === memberold.id && (dateNow.valueOf() - the.createdTimestamp) < 60000) audit = the;
            auditPerm = true;
        }
        if (membernew.roles.cache.size > memberold.roles.cache.size) {
            const use = membernew.roles.cache.difference(memberold.roles.cache).sort((a, b) => b.position - a.position).map(r => r.id);
            const use2 = memberold.roles.cache.sort((a, b) => b.position - a.position).map(r => r.id).slice(0, -1);

            emb.addField(`Role${use.length > 1 ? "s" : ""} added`,
                ("<@&" + use.slice(0, 39).join(">, <@&") + ">" + (use.length > 39 ? ` and ${use.slice(39).length} more...` : "")))

                .setDescription(`**Old role${use2.length > 2 ? "s" : ""}**\n` + (memberold.roles.cache.size > 1 ? "<@&" +
                    use2.slice(0, 80).join(">, <@&") + ">" + (use2.length > 80 ? ` and ${use2.slice(80).length} more...` : "") : "`[NONE]`"));
        }
        if (membernew.roles.cache.size < memberold.roles.cache.size) {
            const use = memberold.roles.cache.difference(membernew.roles.cache).sort((a, b) => b.position - a.position).map(r => r.id);
            const use2 = membernew.roles.cache.sort((a, b) => b.position - a.position).map(r => r.id).slice(0, -1);

            emb.addField(`Role${use.length > 1 ? "s" : ""} removed`,
                ("<@&" + use.slice(0, 39).join(">, <@&") + ">" + (use.length > 39 ? ` and ${use.slice(39).length} more...` : "")))

                .setDescription(`**Current role${use2.length > 2 ? "s" : ""}**\n` + (membernew.roles.cache.size > 1 ? "<@&" +
                    use2.slice(0, 80).join(">, <@&") + ">" + (use2.length > 80 ? ` and ${use2.slice(80).length} more...` : "") : "`[NONE]`"));
        }
        if (audit.executor) {
            if (!audit.executor.bot) nullReason = true;
            emb.setAuthor(emb.author.name, audit.executor.displayAvatarURL({ size: 128, format: "png", dynamic: true }));
        }
    }
    if (membernew.guild.DB.eventChannels?.member && membernew.roles.cache.size === memberold.roles.cache.size) {
        log = getChannel(membernew, membernew.guild.DB.eventChannels.member);
        if (membernew.displayName !== memberold.displayName) {
            if (membernew.guild.me.hasPermission("VIEW_AUDIT_LOG")) {
                // console.log("FETCH NICK LOG", membernew.user.tag);
                const the = (await membernew.guild.fetchAuditLogs({ limit: 1, type: "MEMBER_UPDATE" })).entries.first();
                if (the.target.id === memberold.id) audit = the;
                if (the.executor.id === memberold.id) nullReason = true;
                auditPerm = true;
            }
            emb.addField("Nickname", "Changed from `" + memberold.displayName + "` to `" + membernew.displayName + "`");
            if (audit.executor) {
                if (!audit.executor.bot) nullReason = true;
                emb.setAuthor(emb.author.name, audit.executor.displayAvatarURL({ size: 128, format: "png", dynamic: true }));
            }
        }
        if (membernew.user.DB.cachedAvatarURL !== NEWAV) {
            nullReason = true;
            emb.setImage(NEWAV)
                .setAuthor(emb.author.name, NEWAV)
                .addField("Avatar", thumbMes + "The image below is the user's new avatar.");
            if (oldAV) emb.setThumbnail(oldAV);
        }
    }
    // console.log(audit);
    emb.setTitle("Profile " + (membernew.user.bot ? "`[BOT]` " : "") + "`" + membernew.user.tag + "` updated" +
        (audit?.executor ? ` by ${audit.executor.bot ? "`[BOT]` " : ""}\`${audit.executor.tag}\`` : ""))
        .setColor(getColor("blue"))
        .addField("User", `<@${membernew.user.id}>\n(${membernew.user.id})`, true);
    if (emb.fields[0]?.name !== "Avatar")
        emb.setFooter(emb.footer.text || "​", NEWAV);
    if (!nullReason) {
        if (auditPerm) {
            emb.setDescription((audit?.reason || "No reason provided") + (emb.description ? "\n\n" + emb.description : ""));
            console.log; // BREAKPOINT
        } else emb.setDescription("Unknown reason" + (emb.description ? "\n\n" + emb.description : ""));
    };
    if (emb.fields.length < 2) return;
    if (audit.executor && audit.executor?.id !== membernew.user.id) {
        emb.addField("Moderator", `<@${audit.executor.id}>\n(${audit.executor.id})`, true);
    };
    membernew.user.DB.cachedAvatarURL = NEWAV;
    membernew.user.setDb("cachedAvatarURL", membernew.user.DB.cachedAvatarURL);
    if (!emb.fields || emb.fields.length < 2) return;
    return trySend(membernew.client, log, emb);
}
