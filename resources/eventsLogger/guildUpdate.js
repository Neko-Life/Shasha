'use strict';

const { Guild, MessageEmbed } = require("discord.js");
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
    const newIcon = newGuild.iconURL({ size: 4096, format: "png", dynamic: true });
    if (newGuild.DB.eventChannels.guild) {
        const logChannel = newGuild.channels.cache.get(newGuild.DB.eventChannels.guild);
        if (!logChannel) return;
        let audit = {}, newBanner, oldBanner, newSplash, oldSplash, newSDisc, oldSDisc;
        const cached = newGuild.DB.cached;
        if (newGuild.me.hasPermission("VIEW_AUDIT_LOG")) {
            audit = (await newGuild.fetchAuditLogs({ "limit": 1, "type": "GUILD_UPDATE" })).entries.first();
        } else audit.reason = "Unknown reason";

        const emb = defaultEventLogEmbed(newGuild).setColor(getColor("cyan"));

        if (oldGuild.name !== newGuild.name) {
            emb.addField("Name", `Changed from \`${oldGuild.name}\` to \`${newGuild.name}\``);
        };

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

        const sysCID = oldGuild.systemChannelID || cached.systemChannelID;
        if (sysCID !== newGuild.systemChannelID) {
            emb.addField("System Messages Channel", "Changed from " + (
                sysCID ?
                    "<#" + sysCID + ">" :
                    "`[NONE]`"
            ) + " to " + (
                    newGuild.systemChannelID ?
                        "<#" + newGuild.systemChannelID + ">" :
                        "`[NONE]`"
                )
            )
        };

        if (oldGuild.systemChannelFlags !== newGuild.systemChannelFlags) {
            const oldSCF = oldGuild.systemChannelFlags.serialize(),
                newSCF = newGuild.systemChannelFlags.serialize();
            let boostMes = "", welcomeMes = "";
            if (oldSCF.WELCOME_MESSAGE_DISABLED !== newSCF.WELCOME_MESSAGE_DISABLED)
                welcomeMes += `\`${newSCF.WELCOME_MESSAGE_DISABLED ? "Disabled" : "Enabled"}\` join notifications\n`;
            if (oldSCF.BOOST_MESSAGE_DISABLED !== newSCF.BOOST_MESSAGE_DISABLED)
                boostMes += `\`${newSCF.BOOST_MESSAGE_DISABLED ? "Disabled" : "Enabled"}\` boost notifications\n`;
            if ((welcomeMes + boostMes).length) emb.addField("System Messages Channel Notifications", (welcomeMes + boostMes).slice(0, -1));
        };

        if (newGuild.defaultMessageNotifications !== oldGuild.defaultMessageNotifications) {
            let oldstr, newstr;
            switch (oldGuild.defaultMessageNotifications) {
                case "ALL": oldstr = "All Messages"; break;
                case "MENTIONS": oldstr = "Only @mentions"; break;
                default: console.log("NOT ALL OR MENTIONS:", oldGuild.defaultMessageNotifications);
            };

            switch (newGuild.defaultMessageNotifications) {
                case "ALL": newstr = "All Messages"; break;
                case "MENTIONS": newstr = "Only @mentions"; break;
                default: console.log("NOT ALL OR MENTIONS:", newGuild.defaultMessageNotifications);
            };

            emb.addField("Default Notifications Setting", `Changed from \`${oldstr}\` to \`${newstr}\``);
        };

        if (newGuild.rulesChannelID !== oldGuild.rulesChannelID) {
            emb.addField("Rules or Guidelines Channel", `Changed from <#${oldGuild.rulesChannelID}> to <#${newGuild.rulesChannelID}>`);
        };

        if (oldGuild.banner !== newGuild.banner) {
            oldBanner = oldGuild.bannerURL({ size: 4096, format: "png" });
            newBanner = newGuild.bannerURL({ size: 4096, format: "png" });
        };

        if (oldGuild.splash !== newGuild.splash) {
            oldSplash = oldGuild.splashURL({ size: 4096, format: "png" });
            newSplash = newGuild.splashURL({ size: 4096, format: "png" });
        };

        if (oldGuild.discoverySplash !== newGuild.discoverySplash) {
            oldSDisc = oldGuild.discoverySplashURL({ size: 4096, format: "png" });
            newSDisc = newGuild.discoverySplashURL({ size: 4096, format: "png" });
        };

        emb.setTitle(`Server Settings Updated ${audit.executor ? "by `" + audit.executor.tag + "`" : ""}`);
        if (audit.executor) {
            if (audit.executor.bot)
                emb.setDescription(audit.reason || "No reason provided");
            emb.setAuthor(emb.author.name, audit.executor.displayAvatarURL({ size: 128, format: "png", dynamic: true }));
        };

        if (cached.iconURL && cached.iconURL !== newIcon) {
            const newEmb = new MessageEmbed(emb);
            await elseImageEmbed(logChannel, newEmb, "Icon", "This embed's thumbnail is the server's old icon.\nThe image below is the server's new icon.", cached.iconURL, newIcon);
        };

        if (oldBanner || newBanner) {
            const newEmb = new MessageEmbed(emb);
            await elseImageEmbed(logChannel, newEmb, "Banner", "This embed's thumbnail is the server's old banner.\nThe image below is the server's new banner.", oldBanner, newBanner);
        };

        if (oldSplash || newSplash) {
            const newEmb = new MessageEmbed(emb);
            await elseImageEmbed(logChannel, newEmb, "Splash Invite", "This embed's thumbnail is the server's old splash invite.\nThe image below is the server's new splash invite.", oldSplash, newSplash);
        };

        if (oldSDisc || newSDisc) {
            const newEmb = new MessageEmbed(emb);
            await elseImageEmbed(logChannel, newEmb, "Splash Discovery", "This embed's thumbnail is the server's old splash discovery.\nThe image below is the server's new splash discovery.", oldSDisc, newSDisc);
        };

        if (!emb.fields.length) return;

        newGuild.updateCached("systemChannelID", newGuild.systemChannelID);
        newGuild.updateCached("iconURL", newIcon);
        return trySend(newGuild.client, logChannel, emb);
    }

    newGuild.updateCached("systemChannelID", newGuild.systemChannelID);
    newGuild.updateCached("iconURL", newIcon);
}

async function elseImageEmbed(channel, embed, fieldName, fieldValue, thumbnail, image) {
    embed.fields = [];
    embed.addField(fieldName, fieldValue)
        .setThumbnail(thumbnail)
        .setImage(image);
    return trySend(channel.client, channel, embed);
}