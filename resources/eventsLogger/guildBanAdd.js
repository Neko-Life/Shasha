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
    if (GUILD.DB.settings.eventChannels?.ban) {
        if (USER.partial) USER = await USER.fetch();
        const log = getChannel(GUILD, GUILD.DB.settings.eventChannels.ban);
        if (!log) return;
        const emb = defaultEventLogEmbed(GUILD);
        let audit;
        if (GUILD.member(GUILD.client.user).hasPermission("VIEW_AUDIT_LOG")) {
            audit = (await GUILD.fetchAuditLogs({ limit: 1, type: "MEMBER_BAN_ADD" })).entries.first().executor;
        }
        const rea = (await GUILD.fetchBan(USER)).reason;
        emb.setDescription(rea || "No reason provided")
            .setTitle(`\`${USER.tag}\` banned` + (audit ? ` by \`${audit.tag}\`` : ""))
            .setColor(getColor("red"))
            .setThumbnail(USER.displayAvatarURL({ size: 4096, format: "png", dynamic: true }))
            .addField("User", `<@${USER.id}>\n(${USER.id})`);
        return trySend(GUILD.client, log, emb);
    }
}