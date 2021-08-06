'use strict';

const { Guild } = require("discord.js");
const { Interval } = require("luxon");
const { intervalToDuration } = require("../../cmds/moderation/src/duration");
const { defaultEventLogEmbed, trySend } = require("../functions");
const getColor = require("../getColor");

/**
 * @param {Guild} oldGuild 
 * @param {Guild} newGuild 
 */
module.exports = async (oldGuild, newGuild) => {
    if (!newGuild.DB) await newGuild.dbLoad();
    if (newGuild.DB.eventChannels.guild) {
        const logChannel = newGuild.channels.cache.get(newGuild.DB.eventChannels.guild);
        if (!logChannel) return;
        let audit = {};
        if (newGuild.me.hasPermission("VIEW_AUDIT_LOG")) {
            audit = (await newGuild.fetchAuditLogs({ "limit": 1, "type": "GUILD_UPDATE" })).entries.first();
        } else audit.reason = "Unknown reason";
        const emb = defaultEventLogEmbed(newGuild).setColor(getColor("cyan"));
        if (oldGuild.afkChannelID !== newGuild.afkChannelID) {
            emb.addField("Inactive Channel", "Changed from " + (oldGuild.afkChannelID ? "<#" + oldGuild.afkChannelID + ">" : "`[NONE]`") +
                " to " + (newGuild.afkChannelID ? "<#" + newGuild.afkChannelID + ">" : "`[NONE]`"));
        };
        if (oldGuild.afkTimeout !== newGuild.afkTimeout) {
            const newAfkTDuration = intervalToDuration(Interval.after(new Date(),
                newGuild.afkTimeout * 1000)).strings.join(" ");
            const oldAfkTDuration = intervalToDuration(Interval.after(new Date(),
                oldGuild.afkTimeout * 1000)).strings.join(" ");
            emb.addField("Inactive Timeout", "Changed from `" + oldAfkTDuration + "` to `" + newAfkTDuration + "`");
        };

        emb.setTitle(`Guild Settings Updated ${audit.executor ? "by `" + audit.executor.tag + "`" : ""}`)
            .setDescription(audit.reason || "No reason provided");
        if (audit.executor)
            emb.setAuthor(emb.author.name, audit.executor.displayAvatarURL({ size: 128, format: "png", dynamic: true }));
        return trySend(newGuild.client, logChannel, emb);
    }
}