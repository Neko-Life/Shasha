'use strict';

const { channel } = require("diagnostics_channel");
const { MessageEmbed } = require("discord.js");
const { Command } = require("../../classes/Command");
const { fetchAllMembers } = require("../../functions");
const getColor = require("../../getColor");


const getEmbed = {
    GUILD_TEXT: async (channel, baseEmbed) => {
        const emb = new MessageEmbed(baseEmbed)
            .addField("NSFW", channel.nsfw ? "`Yes`" : "`No`", true)
            .addField("Threads",);
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
        if (!channel) channel = inter.channel;
        else channel = channel.channel;
        await fetchAllMembers(channel.guild);
        const viewableCount = channel.members.cache.size;
        const baseEmbed = new MessageEmbed()
            .addField("Identifier", `\`${channel.name}\`\n(${channel.id})`, true)
            .setColor(getColor(inter.member.displayColor))
            .addField("Viewable by", `\`${viewableCount}\` member${viewableCount > 1 ? "s" : ""}`, true)
            .setTitle("About Channel **" + channel + "**");
        if (channel.parent) {
            emb.addField("Category", "`" + channel.parent.name + "`", true)
                .addField("Pemissions Synced", channel.permissionsLocked ? "`Yes`" : "`No`", true);
        }
        if (channel.topic) baseEmbed.setDescription(channel.topic);
        const emb = await getEmbed[channel.type](channel, baseEmbed);
        console.log; // Very cool :)
    }
}