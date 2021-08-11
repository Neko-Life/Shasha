'use strict';

const { Message } = require("discord.js");
const { trySend, defaultEventLogEmbed, getChannel } = require("../functions");
const getColor = require("../getColor");

/**
 * Log message update
 * @param {Message} msgold 
 * @param {Message} msgnew 
 * @returns 
 */
module.exports = async (msgold, msgnew) => {
    if (msgnew.partial) msgnew = await msgnew.fetch();
    if (msgnew.partial) return;
    if (msgnew.guild) {
        if (!msgnew.guild.DB) await msgnew.guild.dbLoad();
        msgnew.guild.updateCached("systemChannelID", msgnew.guild.systemChannelID);
        msgnew.guild.updateCached("iconURL", msgnew.guild.iconURL({ size: 4096, format: "png", dynamic: true }));
    }
    if (msgnew.content === msgold.content) return;
    const ignored = msgnew.guild.DB.eventChannels.mesEd?.ignore?.includes(msgnew.channel.id) || false;
    let check = false;
    if (msgnew.channel.id === msgnew.guild.DB.eventChannels.mesEd?.channel && (msgnew.author ? msgnew.author !== msgnew.client.user : false) && ignored === false) check = true;
    if (msgnew.guild.DB.eventChannels.mesEd?.channel !== msgnew.channel.id && ignored === false || check) {
        const log = getChannel(msgnew, msgnew.guild.DB.eventChannels.mesEd?.channel);
        if (!log || !msgnew.author) return;
        const emb = defaultEventLogEmbed(msgnew.guild)
            .setColor(getColor("blue"))
            .setDescription(msgnew.content.length > 0 ? msgnew.content : "`[EMPTY]`")
            .addField("Original content", msgold.content?.length > 0 ? (msgold.content.slice(0, msgold.content.length < 1025 ? 1024 : 1021) + (msgold.content.length < 1025 ? "" : "...")) : "`[EMPTY]`")
            .setTitle("Message " + msgnew.id + " edited")
            .setAuthor(msgnew.guild.name, msgnew.author.displayAvatarURL({ format: "png", size: 128, dynamic: true }))
            .addField("Author", `<@!${msgnew.author?.id}>\n\`${msgnew.author?.tag}\`\n(${msgnew.author?.id})`, true)
            .addField("Channel", `<#${msgnew.channel?.id}>\n\`${msgnew.channel?.name}\`\n(${msgnew.channel?.id})`, true)
            .setURL(msgnew.url);
        return trySend(msgnew.client, log, emb);
    }
}
