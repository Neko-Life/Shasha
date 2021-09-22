'use strict';

const { MessageEmbed } = require("discord.js");
const { Interval, DateTime } = require("luxon");
const { Command } = require("../../classes/Command");
const { fetchAllMembers, strYesNo, maxLengthPad } = require("../../functions");
const getColor = require("../../getColor");
const { intervalToStrings, createInterval } = require("../../rsc/Duration");

const getEmbed = {
    GUILD_TEXT: async (channel, baseEmbed) => {
        await fetchAllMembers(channel.guild);
        const viewableCount = channel.members.size;
        const threadCount = channel.threads.cache.size;
        const emb = new MessageEmbed(baseEmbed)
            .addField("Viewable by", `\`${viewableCount}\` member${viewableCount > 1 ? "s" : ""}`, true)
            .setTitle("About Channel **" + channel.name + "**")
            .addField("NSFW", strYesNo(channel.nsfw), true);
        if (threadCount) emb.addField("Threads", "`" + threadCount + "`", true);
        return emb;
    },
    GUILD_PUBLIC_THREAD: async (channel, baseEmbed) => {
        await fetchAllMembers(channel.guild);
        const emb = new MessageEmbed(baseEmbed)
            .setTitle("About Thread **" + channel.name + "**")
            .addField("Archived", strYesNo(channel.archived), true)
            .addField("Archive Duration",
                intervalToStrings(Interval.after(new Date(),
                    channel.autoArchiveDuration * 60 * 1000))
                    .strings.join(" "));

        if (channel.archivedAt.valueOf() > new Date().valueOf()) emb.addField("Archiving At",
            "<t:" + Math.floor(channel.archiveTimestamp / 1000) + ":F>\n"
            + `(in ${intervalToStrings(createInterval(new Date(), channel.createdAt)).strings.join(" ")})`);

        emb.addField("Permanently Archived", strYesNo(channel.unarchivable), true)
            .addField("Public", strYesNo(channel.sendable), true)
            .addField("Locked", strYesNo(channel.locked), true)
            .addField("Participant", "`" + (channel.memberCount || 0) + "`", true)
            .addField("Active Participant", "`" + channel.members.cache.size + "`", true)
            .addField("Rate Limit", "`" + channel.rateLimitPerUser + "`", true);
        return emb;
    },
    GUILD_CATEGORY: async (channel, baseEmbed) => {
        await fetchAllMembers(channel.guild);
        const viewableCount = channel.members.size;
        let chCount = "";
        if (channel.children.size) {
            const ch = {};
            const mL = [];
            for (const [key, val] of channel.children) {
                let type = val.type;
                if (type.startsWith("GUILD_")) type = type.slice("GUILD_".length);
                if (!ch[type]) {
                    ch[type] = 0;
                    mL.push(type);
                }
                ch[type]++;
                if (!ch.NSFW) {
                    ch.NSFW = 0;
                    mL.push("NSFW");
                }
                if (val.nsfw) ch.NSFW++;
            }
            mL.push("Total");
            const maxL = maxLengthPad(mL) + 1;
            for (const C in ch) {
                if (C === "NSFW") continue;
                const n = ch[C];
                chCount += `\`${C.padEnd(maxL, " ")}\`: \`${n}\`\n`;
            }
            chCount += `\`${"Total".padEnd(maxL, " ")}\`: \`${channel.children.size}\``;
            if (ch.NSFW) chCount += `\n\n\`${"NSFW".padEnd(maxL, " ")}\`: \`${ch.NSFW}\``;
        }
        const emb = new MessageEmbed(baseEmbed);
        if (chCount.length) emb.addField("Sub-channel", chCount, true);
        emb.setTitle("About Channel Category **" + channel.name + "**")
            .addField("Viewable by", `\`${viewableCount}\` member${viewableCount > 1 ? "s" : ""}`, true);

        return emb;
    }
}

module.exports = class ChannelInfoCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "channel",
            guildOnly: true,
            clientPermissions: ["EMBED_LINKS"]
        });
    }

    async run(inter, { channel }) {
        await inter.deferReply();
        if (!channel) channel = inter.channel;
        else channel = channel.channel;
        const baseEmbed = new MessageEmbed()
            .addField("Identifier", `\`${channel.name}\`\n(${channel.id})`)
            .addField("Created", `<t:${Math.floor(channel.createdTimestamp / 1000)}:F>\n`
                + `(${intervalToStrings(
                    Interval.fromDateTimes(
                        DateTime.fromJSDate(channel.createdAt),
                        DateTime.fromJSDate(new Date())
                    )
                ).strings.join(" ")} ago)`)
            .setColor(getColor(inter.member.displayColor));
        if (channel.parent) {
            baseEmbed.addField("Parent", "`" + channel.parent.name + "`", true)
            if (channel.permissionsLocked !== undefined)
                baseEmbed.addField("Pemissions Synced", strYesNo(channel.permissionsLocked), true);
        }
        if (channel.topic) baseEmbed.setDescription(channel.topic);
        const emb = await getEmbed[channel.type](channel, baseEmbed);
        console.log;
        return inter.editReply({ embeds: [emb] });
    }
}