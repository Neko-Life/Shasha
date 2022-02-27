"use strict";

const { MessageEmbed } = require("discord.js");
const { PATTERN_MESSAGE_LINK } = require("../constants");
const { loadDb } = require("../database");
const { getChannelMessage, tickTag, getColor, isAdmin, emitShaError, wait } = require("../functions");

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
    await wait(500);
    const link = msg.content.match(new RegExp(PATTERN_MESSAGE_LINK));
    if (!link?.length || msg.deleted)
        return delOldPrev(msg);
    const toPrev = await getChannelMessage(msg, link[0], null, true);
    if (!toPrev || !(toPrev.content?.length || toPrev.embeds?.length || toPrev.attachments?.size || toPrev.stickers?.size))
        return delOldPrev(msg);
    const color = getColor(toPrev.author.accentColor, true, toPrev.member?.displayColor);
    const emb = new MessageEmbed()
        .setAuthor({
            name: tickTag(toPrev.member || toPrev.author),
            iconURL: (toPrev.member || toPrev.author).displayAvatarURL({ size: 128, format: "png", dynamic: true }),
            url: toPrev.url
        }).setColor(color)
        .setTimestamp(toPrev.editedTimestamp || toPrev.createdTimestamp);
    if (toPrev.editedTimestamp) emb.setFooter({ text: `Edited` });
    const alEmb = [emb];
    let content = "";
    if (msg.guild && toPrev.channel?.nsfw && !msg.channel?.nsfw) {
        emb.setDescription("Can't preview NSFW content in Non-NSFW channel");
    } else {
        const memberAdmin = isAdmin(msg.member || msg.author);
        if (toPrev.content?.length) emb.setDescription(msg.client.finalizeStr(toPrev.content, memberAdmin));
        if (toPrev.attachments.size) {
            let im = toPrev.attachments.filter(r => r.contentType.startsWith("image")).map(r => r);
            if (im?.length) {
                if (!emb.image?.url) {
                    emb.setImage(im[0].url);
                    im = im.slice(1);
                }
                for (const a of im)
                    alEmb.push(
                        new MessageEmbed()
                            .setImage(a.url)
                            .setColor(color)
                    );
            }
            let vids = toPrev.attachments.filter(r => r.contentType.startsWith("video"));
            if (vids?.size) content = "`[ATTACHMENTS]`\n" + vids.map(r => r.url).join("\n");
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
            if (images?.length) {
                if (!emb.image?.url) {
                    emb.setImage(images[0].url);
                    images = images.slice(1);
                }
                for (const a of images)
                    alEmb.push(
                        new MessageEmbed()
                            .setImage(a.url)
                            .setColor(color)
                    );
            }
            let gifPng = toPrev.embeds.filter(r => r.type === "gifv").map(r => r);
            if (gifPng?.length) {
                if (!emb.image?.url) {
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
    }
    const send = { embeds: alEmb.slice(0, 10), allowedMentions: { parse: [] }, content: content || null };
    let m;
    const sticker = toPrev.stickers.first();
    if (!msg.messageLinkPreview || msg.messageLinkPreview?.deleted) {
        if (sticker) send.stickers = [sticker.id];
        try {
            m = await msg.reply(send);
        } catch (e) {
            if (/Cannot use this sticker/.test(e.message)) {
                delete send.stickers;
                send.embeds[0].setThumbnail(sticker.url);
                m = await msg.reply(send);
            } else emitShaError(e);
        }
        msg.messageLinkPreview = m;
    } else {
        if (sticker) send.embeds[0].setThumbnail(sticker.url);
        m = await msg.messageLinkPreview.edit(send);
    }
    return m;
}
