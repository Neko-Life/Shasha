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
    const link = msg.content.match(/https?:\/\/(?:www\.|canary\.|ptb\.)?discord(?:app)?\.(?:gg|com)\/channels\/(?:\d{17,20}|@me)\/\d{17,20}\/\d{17,20}/);
    if (!link?.length || msg.deleted)
        return delOldPrev(msg);
    const toPrev = await getChannelMessage(msg, link[0], null, true);
    if (!toPrev || !(toPrev.content?.length || toPrev.embeds?.length || toPrev.attachments?.size))
        return delOldPrev(msg);
    const color = getColor(toPrev.author.accentColor, true, toPrev.member?.displayColor);
    const emb = new MessageEmbed()
        .setAuthor({
            name: tickTag(toPrev.member?.displayName || toPrev.author).replace(/`/g, ""),
            iconURL: (toPrev.member || toPrev.author).displayAvatarURL({ size: 128, format: "png", dynamic: true }),
            url: toPrev.url
        }).setColor(color);
    const alEmb = [emb];
    let content = "";
    if (msg.guild && toPrev.channel?.nsfw && !msg.channel?.nsfw) {
        emb.setDescription("Can't preview NSFW content in Non-NSFW channel");
    } else {
        const memberAdmin = isAdmin(msg.member || msg.author);
        if (toPrev.content?.length) emb.setDescription(msg.client.finalizeStr(toPrev.content, memberAdmin));
        if (toPrev.attachments.size) {
            let att = toPrev.attachments.filter(r => r.contentType.startsWith("image")).map(r => r);
            if (!emb.image) {
                emb.setImage(att[0].url);
                att = att.slice(1);
            }
            for (const a of att)
                alEmb.push(
                    new MessageEmbed()
                        .setImage(a.url)
                        .setColor(color)
                );
        } else emb.setImage(null);
        if (toPrev.embeds?.length) {
            alEmb.push(
                ...toPrev.embeds.filter(
                    r => r.type === "rich"
                        || (
                            r.type === "video"
                            && (r.description || r.title)
                        )
                ).map(r => msg.client.finalizeEmbed(r, memberAdmin))
            );
            let images = toPrev.embeds.filter(r => r.type === "image").map(r => r);
            if (!emb.image) {
                emb.setImage(images[0].url);
                images = images.slice(1);
            }
            for (const a of images)
                alEmb.push(
                    new MessageEmbed()
                        .setImage(a.url)
                        .setColor(color)
                );
            let gifPng = toPrev.embeds.filter(r => r.type === "gifv").map(r => r);
            if (!emb.image) {
                emb.setImage(gifPng[0].thumbnail.url);
                gifPng = gifPng.slice(1);
            }
            for (const a of gifPng)
                alEmb.push(
                    new MessageEmbed()
                        .setImage(a.thumbnail.url)
                        .setColor(color)
                );
        }
    }
    const send = { embeds: alEmb.slice(0, 10), allowedMentions: { parse: [] } };
    if (content.length) send.content = content;
    let m;
    if (!msg.messageLinkPreview || msg.messageLinkPreview?.deleted) {
        m = await msg.reply(send);
        msg.messageLinkPreview = m;
    } else m = await msg.messageLinkPreview.edit(send);
    return m;
}