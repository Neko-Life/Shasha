'use strict';

const { MessageEmbed } = require("discord.js");
const { Interval, DateTime } = require("luxon");
const { Command } = require("../../classes/Command");
const { fetchAllMembers, strYesNo, maxLengthPad } = require("../../functions");
const getColor = require("../../getColor");
const { intervalToStrings, createInterval } = require("../../rsc/Duration");

class GetEmbed {
    static async GUILD_TEXT(channel, baseEmbed) {
        await fetchAllMembers(channel.guild);
        const viewableCount = channel.members.size;
        const threadCount = {
            PUBLIC: channel.threads.cache.filter(r => r.type === "GUILD_PUBLIC_THREAD").size,
            PRIVATE: channel.threads.cache.filter(r => r.type === "GUILD_PRIVATE_THREAD").size
        };
        const emb = new MessageEmbed(baseEmbed)
            .addField("Viewable by", `\`${viewableCount}\` member${viewableCount > 1 ? "s" : ""}`, true)
            .setTitle("About Channel **" + channel.name + "**");
        if (channel.threads.cache.size) {
            const maxL = [];
            for (const T in threadCount) {
                if (!threadCount[T]) continue;
                maxL.push(T);
            }
            maxL.push("Total");
            const maxN = maxLengthPad(maxL) + 1;
            let str = "";
            for (const I in threadCount) {
                if (!threadCount[I]) continue;
                str += `\`${I.padEnd(maxN, " ")}\`: \`${threadCount[I]}\`\n`;
            }
            str += `\`${"Total".padEnd(maxN, " ")}\`: \`${channel.threads.cache.size}\`\n`
            emb.addField("Threads", str, true);
        }
        emb.addField("NSFW", strYesNo(channel.nsfw), true)
        return emb;
    }
    static async GUILD_PUBLIC_THREAD(channel, baseEmbed) {
        await fetchAllMembers(channel.guild);
        const emb = new MessageEmbed(baseEmbed)
            .setTitle("About Public Thread **" + channel.name + "**")
            .addField("Archived", strYesNo(channel.archived), true)
            .addField("Archive Duration",
                intervalToStrings(Interval.after(new Date(),
                    channel.autoArchiveDuration * 60 * 1000))
                    .strings.join(" "));

        if (channel.archivedAt.valueOf() > new Date().valueOf()) emb.addField("Archived At",
            "<t:" + Math.floor(channel.archiveTimestamp / 1000) + ":F>\n"
            + `(in ${intervalToStrings(createInterval(new Date(), channel.createdAt)).strings.join(" ")})`);

        emb.addField("Permanent Archived", strYesNo(channel.unarchivable), true)
            .addField("Locked", strYesNo(channel.locked), true)
            .addField("Participant", "`" + (channel.memberCount || 0) + "`", true)
            .addField("Active Participant", "`" + channel.members.cache.size + "`", true)
            .addField("Rate Limit", "`" + channel.rateLimitPerUser + "`", true);
        return emb;
    }
    static async GUILD_CATEGORY(channel, baseEmbed) {
        await fetchAllMembers(channel.guild);
        const viewableCount = channel.members.size;
        let chCount = "";
        if (channel.children.size) {
            const ch = {};
            const mL = [];
            let tC = 0;
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
                if (type === "TEXT") {
                    const threadCount = {
                        PUBLIC_THREAD: val.threads.cache.filter(r => r.type === "GUILD_PUBLIC_THREAD").size,
                        PRIVATE_THREAD: val.threads.cache.filter(r => r.type === "GUILD_PRIVATE_THREAD").size
                    }
                    for (const T in threadCount) {
                        if (!threadCount[T]) continue;
                        if (!ch[T]) {
                            ch[T] = 0;
                            mL.push(T);
                        }
                        ch[T] += threadCount[T];
                        tC += threadCount[T];
                    }
                }
            }
            mL.push("Total");
            const maxL = maxLengthPad(mL) + 1;
            for (const C in ch) {
                if (C === "NSFW") continue;
                const n = ch[C];
                chCount += `\`${C.padEnd(maxL, " ")}\`: \`${n}\`\n`;
            }
            chCount += `\`${"Total".padEnd(maxL, " ")}\`: \`${channel.children.size + tC}\``;
            if (ch.NSFW) chCount += `\n\n\`${"NSFW".padEnd(maxL, " ")}\`: \`${ch.NSFW}\``;
        }
        const emb = new MessageEmbed(baseEmbed);
        if (chCount.length) emb.addField("Channel Count", chCount, true);
        emb.setTitle("About Channel Category **" + channel.name + "**")
            .addField("Viewable by", `\`${viewableCount}\` member${viewableCount > 1 ? "s" : ""}`, true);

        return emb;
    }
    static async GUILD_PRIVATE_THREAD(channel, baseEmbed) {
        return this.GUILD_PUBLIC_THREAD(channel, baseEmbed).then(r =>
            r.setTitle("About Private Thread **" + channel.name + "**")
        );
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
        const emb = await GetEmbed[channel.type](channel, baseEmbed);
        return inter.editReply({ embeds: [emb] });
    }
}