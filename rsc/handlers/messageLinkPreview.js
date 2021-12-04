'use strict';

const { MessageEmbed } = require("discord.js");
const { loadDb } = require("../database");
const { getChannelMessage, tickTag, getColor, isAdmin } = require("../functions");

async function delOldPrev(msg) {
    if (msg.messageLinkPreview)
        if (!msg.messageLinkPreview.deleted)
            return msg.messageLinkPreview.delete();
}

/**
 * 
 * @param {import("../typins").ShaMessage} msg 
 * @returns 
 */
module.exports = async (msg) => {
    if (!msg.author) return;
    if (msg.author.bot) return;
    if (!msg.content?.length) return;
    if (msg.guild) {
        if (!msg.channel.permissionsFor?.(msg.client.user).has("SEND_MESSAGES")
            || !msg.channel.permissionsFor?.(msg.client.user).has("EMBED_LINKS"))
            return;
        if (!msg.guild.messageLinkPreviewSettings) {
            const gd = loadDb(msg.guild, "guild/" + msg.guild.id);
            const get = await gd.db.getOne("messageLinkPreviewSettings", "Object");
            msg.guild.messageLinkPreviewSettings = get?.value || { state: true };
        }
        if (!msg.guild.messageLinkPreviewSettings.state) return;
    }
    const link = msg.content.match(/https?:\/\/(?:www\.|canary\.)?discord(?:app)?\.(?:gg|com)\/channels\/(?:\d{18,20}|@me)\/\d{18,20}\/\d{18,20}/);
    if (!link?.length || msg.deleted)
        return delOldPrev(msg);
    const toPrev = await getChannelMessage(msg, link[0], null, true);
    if (!toPrev || !(toPrev.content?.length || toPrev.embeds?.length || toPrev.attachments?.size))
        return delOldPrev(msg);
    const emb = new MessageEmbed()
        .setAuthor(
            tickTag(toPrev.member?.displayName || toPrev.author).replace(/`/g, ""),
            (toPrev.member || toPrev.author).displayAvatarURL({ size: 128, format: "png", dynamic: true }),
            toPrev.url
        ).setColor(getColor(toPrev.author.accentColor, true, toPrev.member?.displayColor));
    const alEmb = [emb];
    if (toPrev.channel?.nsfw && !msg.channel?.nsfw) {
        emb.setDescription("Can't preview NSFW content in Non-NSFW channel");
    } else {
        const memberAdmin = isAdmin(msg.member || msg.author);
        if (toPrev.content?.length) emb.setDescription(msg.client.finalizeStr(toPrev.content, memberAdmin));
        if (toPrev.attachments.size) {
            const att = toPrev.attachments.first().url;
            emb.setImage(att);
        } else emb.setImage(null);
        if (toPrev.embeds?.length) alEmb.push(
            ...toPrev.embeds.map(r => msg.client.finalizeEmbed(r, memberAdmin))
        );
    }
    const send = { embeds: alEmb, allowedMentions: { parse: [] } };
    let m;
    if (!msg.messageLinkPreview || msg.messageLinkPreview?.deleted) {
        m = await msg.reply(send);
        msg.messageLinkPreview = m;
    } else m = await msg.messageLinkPreview.edit(send);
    return m;
}