'use strict';

const { MessageEmbed } = require("discord.js");
const { Interval, DateTime } = require("luxon");
const { Command } = require("../../classes/Command");
const { fetchAllMembers, strYesNo } = require("../../functions");
const getColor = require("../../getColor");
const { intervalToStrings, createInterval } = require("../../rsc/Duration");

const getEmbed = {
    GUILD_TEXT: async (channel, baseEmbed) => {
        const viewableCount = channel.members.size;
        const threadCount = channel.threads.cache.size;
        const emb = new MessageEmbed(baseEmbed)
            .addField("Viewable by", `\`${viewableCount}\` member${viewableCount > 1 ? "s" : ""}`, true)
            .setTitle("About Channel **" + channel.name + "**")
            .addField("NSFW", strYesNo(channel.nsfw), true);
        if (threadCount) emb.addField("Threads", "`" + threadCount + "`", true);
        return emb;
    },
    GUILD_PUBLIC_THREAD: (channel, baseEmbed) => {
        const emb = new MessageEmbed(baseEmbed)
            .setTitle("About Thread **" + channel.name + "**")
            .addField("Archived", strYesNo(channel.archived), true)
            .addField("Archive Duration", intervalToStrings(Interval.after(new Date(), channel.autoArchiveDuration * 60 * 1000)).strings.join(" "));

        if (channel.archivedAt.valueOf() > new Date().valueOf()) emb.addField("Archiving At",
            "<t:" + Math.floor(channel.archiveTimestamp / 1000) + ":F>\n"
            + `(in ${intervalToStrings(createInterval(new Date(), channel.createdAt)).strings.join(" ")})`);

        emb.addField("Permanently Archived", strYesNo(channel.unarchivable), true)
            .addField("Public", strYesNo(channel.sendable), true)
            .addField("Locked", strYesNo(channel.locked), true)
            .addField("Participant", "`" + channel.memberCount + "`", true)
            .addField("Active Participant", "`" + channel.members.cache.size + "`", true)
            .addField("Rate Limit", "`" + channel.rateLimitPerUser + "`", true);
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
        await fetchAllMembers(channel.guild);
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
            if (channel.permissionsLocked !== undefined) baseEmbed.addField("Pemissions Synced", strYesNo(channel.permissionsLocked), true);
        }
        if (channel.topic) baseEmbed.setDescription(channel.topic);
        const emb = await getEmbed[channel.type](channel, baseEmbed);
        console.log;
        return inter.editReply({ embeds: [emb] });
    }
}