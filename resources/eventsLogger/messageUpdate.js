'use strict';

const { Message } = require("discord.js");
const { trySend, defaultEventLogEmbed, getChannelProchedure } = require("../functions");
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
    if (msgnew.content === msgold.content) return;
    const ignored = msgnew.guild.eventChannels.message.ignore?.includes(msgnew.channel.id) ?? false;
    let check = false;
    if (msgnew.channel.id === msgnew.guild.eventChannels?.message?.channel && msgnew.author ? msgnew.author !== msgnew.client.user : false && ignored === false) check = true;
    if (msgnew.guild.eventChannels?.message?.channel !== msgnew.channel.id && ignored === false || check) {
        const log = getChannelProchedure(msgnew, msgnew.guild.eventChannels.message.channel);
        if (!log || !msgnew.author) return;
        const emb = defaultEventLogEmbed(msgnew.guild);
        emb
        .setColor(getColor("blue"))
        .setDescription(msgnew.content.length > 0 ? msgnew.content : "`[EMPTY]`")
        .addField("Original content", msgold.content?.length > 0 ? (msgold.content.slice(0, msgold.content.length < 1025 ? 1024 : 1021) + (msgold.content.length < 1025 ? "" : "...")) : "`[EMPTY]`" )
        .setTitle("Message " + msgnew.id + " edited")
        .setAuthor(emb.author.name, msgnew.author.displayAvatarURL({format: "png", size: 4096, dynamic: true}))
        .addField("Author", `<@!${msgnew.author?.id}>\n\`${msgnew.author?.tag}\`\n(${msgnew.author?.id})`,true)
        .addField("Channel", `<#${msgnew.channel?.id}>\n\`${msgnew.channel?.name}\`\n(${msgnew.channel?.id})`,true)
        .setURL(msgnew.url);
        return trySend(msgnew.client, log, emb);
    }
}
