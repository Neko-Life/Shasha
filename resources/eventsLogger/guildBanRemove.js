'use strict';

const { Guild, User } = require("discord.js");
const { getChannel, defaultEventLogEmbed, trySend } = require("../functions");
const getColor = require("../getColor");

/**
 * @param {Guild} GUILD
 * @param {User} USER
 * @returns
 */
module.exports = async (GUILD, USER) => {
    if (!GUILD.DB) await GUILD.dbLoad();
    GUILD.updateCached("systemChannelID", GUILD.systemChannelID);
    GUILD.updateCached("iconURL", GUILD.iconURL({ size: 4096, format: "png", dynamic: true }));
    if (GUILD.DB.eventChannels?.unban) {
        if (USER.partial) USER = await USER.fetch();
        const log = getChannel(GUILD, GUILD.DB.eventChannels.unban);
        if (!log) return;
        const emb = defaultEventLogEmbed(GUILD);
        let audit;
        if (GUILD.member(GUILD.client.user).hasPermission("VIEW_AUDIT_LOG")) {
            const the = (await GUILD.fetchAuditLogs({ limit: 1, type: "MEMBER_BAN_REMOVE" })).entries.first();
            console.log(the);
            if (the.target.id === USER.id) audit = the;
            emb.setDescription(audit?.reason || "No reason provided");
        } else emb.setDescription("Unknown reason");

        emb.setTitle(`${USER.bot ? "`[BOT]` " : ""}\`${USER.tag}\` unbanned` + (audit?.executor ? ` by ${audit.executor.bot ? "`[BOT]` " : ""}\`${audit.executor.tag}\`` : ""))
            .setColor(getColor("red"))
            .setThumbnail(USER.displayAvatarURL({ size: 4096, format: "png", dynamic: true }))
            .addField("User", `<@${USER.id}>\n(${USER.id})`, true);
        if (audit.executor) {
            emb.setAuthor(emb.author.name, audit.executor.displayAvatarURL({ size: 128, format: "png", dynamic: true }))
                .addField("Moderator", `<@${audit.executor.id}> (${audit.executor.id})`, true);
        } return trySend(GUILD.client, log, emb);
    }
}