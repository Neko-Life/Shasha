"use strict";

const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { Command } = require("../../classes/Command");
const { wait, getColor, replyError } = require("../../functions");
const { sanitizeUrl } = require("@braintree/sanitize-url");
const { PATTERN_CUSTOM_EMOTE } = require("../../constants");

module.exports = class StealCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "steal",
            description: "Steal some stuff to your server",
            clientPermissions: ["MANAGE_EMOJIS_AND_STICKERS", "EMBED_LINKS", "READ_MESSAGE_HISTORY", "MANAGE_GUILD", "VIEW_CHANNEL"],
            userPermissions: ["MANAGE_EMOJIS_AND_STICKERS", "MANAGE_GUILD"],
            deleteSavedMessagesAfter: 10000,
        });
    }
    /** @param {import("../../typins").ShaCommandInteraction} inter */
    async run(inter) {
        /** @type {import("discord.js").Message} */
        const prompt = await inter.reply({ content: "Give me somethin to steal (can be an emoji, sticker, image attachment or image link):", fetchReply: true });
        const get = await prompt.channel.awaitMessages({ filter: (r) => r.author.id === inter.user.id, max: 1 });
        const mes = get?.first();
        if (!mes) return;
        const data = {
            type: null,
            object: null,
            url: null,
        }
        const getSrc = (type) => {
            const get = mes[type]?.first();
            if (!get) return;
            data.type = type;
            data.object = get;
            data.url = get.url;
            return true;
        }
        if (mes.content.length) {
            const emote = mes.content.match(new RegExp(PATTERN_CUSTOM_EMOTE));
            const g = emote?.[0];
            if (g) {
                data.type = "emote";
                data.url = `https://cdn.discordapp.com/emojis/${g.match(/(?<=:)\d+(?=>)/)[0]}.${g.startsWith("<a") ? "gif" : "webp"}`;
            } else if (!getSrc("stickers")) {
                const url = mes.content.match(/https?:\/\/[^\s]+/);
                if (url?.[0]) {
                    await wait(1000);
                    const tEmb = mes.embeds?.[0];
                    if (tEmb?.type === "image" && tEmb?.url === url[0]) {
                        let use = url[0];
                        if (use.startsWith("https://cdn.discordapp.com/emojis/"))
                            use = use.replace(/\?size=.+/, "");
                        data.type = "image";
                        data.url = use;
                    }
                }
            }
        }
        if (!data.type) {
            if (!getSrc("stickers") && !getSrc("attachments")) return this.saveMessages(
                prompt.edit(
                    "Nothin to steal :/ Try again. Provide an emoji, a sticker, an image attachment or an image link in your reply"
                )
            );
        }
        clearMes(mes, 0);
        data.url = sanitizeUrl(data.url);
        const embColor = getColor(this.user.accentColor, true, this.member.displayColor);
        const emb = new MessageEmbed()
            .setColor(embColor)
            .setTitle("Steal This Stuff?")
            .setDescription(`What do you wanna use this ${data.type} for?`)
            .setImage(data.url);
        const components = [
            new MessageActionRow().addComponents([
                new MessageButton().setStyle("PRIMARY").setLabel("Emoji").setCustomId("emoji"),
                new MessageButton().setStyle("PRIMARY").setLabel("Sticker").setCustomId("sticker"),
                new MessageButton().setStyle("PRIMARY").setLabel("Server Icon").setCustomId("icon"),
            ]),
            new MessageActionRow().addComponents([
                new MessageButton().setStyle("PRIMARY").setLabel("Server Banner").setCustomId("banner"),
                new MessageButton().setStyle("PRIMARY").setLabel("Splash Invite").setCustomId("invite"),
                new MessageButton().setStyle("PRIMARY").setLabel("Splash Discovery").setCustomId("discovery"),
            ]),
        ];
        await prompt.edit({ content: null, embeds: [emb], components });
        const getC = await prompt.awaitMessageComponent({ filter: (r) => r.user.id === this.user.id });
        if (!getC) return;
        if (getC.customId === "emoji") {
            const promptE = await getC.reply({ content: "Give it a name (must match validation regex `/^[\w-_]{2,30}$/`):", fetchReply: true });
            const getN = await promptE.channel.awaitMessages({ filter: (r) => r.content.length && r.author.id === getC.user.id, max: 1 });
            const res = getN?.first();
            if (!res) return;
            try {
                clearMes(promptE, 0, res);
                const newEmote = await this.guild.emojis.create(data.url, res.content);
                return prompt.edit({ content: `Emoji stolen: ${newEmote.toString()}!`, embeds: [], components: [] });
            } catch (e) {
                return prompt.edit(replyError(e));
            }
        } else if (getC.customId === "sticker") {
            const promptE = await getC.reply({ content: "Give it a name (must match validation regex `/^[\w-_]{2,30}$/`):", fetchReply: true });
            const getN = await promptE.channel.awaitMessages({ filter: (r) => r.content.length && r.author.id === getC.user.id, max: 1 });
            const res = getN?.first();
            if (!res) return;
            clearMes(res, 0);
            const sData = {
                name: res.content,
                tag: null,
                description: null,
            };
            await promptE.edit("Give it a tag (a _default discord emoji **name**_ that represent this sticker's expression):");
            const getT = await promptE.channel.awaitMessages({ filter: (r) => r.content.length && r.author.id === getC.user.id, max: 1 });
            const resT = getT?.first();
            if (!resT) return;
            clearMes(resT, 0);
            sData.tag = resT.content;
            await promptE.edit("Sticker description:");
            const getD = await promptE.channel.awaitMessages({ filter: (r) => r.content.length && r.author.id === getC.user.id, max: 1 });
            const resD = getD?.first();
            if (!resD) return;
            clearMes(promptE, 0, resD);
            sData.description = resD.content || null;
            try {
                const newS = await this.guild.stickers.create(data.url, sData.name, sData.tag, { description: sData.description });
                prompt.edit({ content: "Sticker stolen!!", embeds: [], components: [] });
                return prompt.channel.send({ stickers: [newS] });
            } catch (e) {
                return prompt.edit(replyError(e));
            }
        } else if (getC.customId === "icon") {
            await getC.deferUpdate();
            try {
                await this.guild.setIcon(data.url);
                const emb = new MessageEmbed()
                    .setTitle("Server Icon stolen!!")
                    .setColor(embColor)
                    .setImage(data.url);
                return prompt.edit({ content: null, embeds: [emb], components: [] });
            } catch (e) {
                return prompt.edit(replyError(e));
            }
        } else if (getC.customId === "banner") {
            await getC.deferUpdate();
            try {
                await this.guild.setBanner(data.url);
                const emb = new MessageEmbed()
                    .setTitle("Server Banner stolen!!")
                    .setColor(embColor)
                    .setImage(data.url);
                return prompt.edit({ content: null, embeds: [emb], components: [] });
            } catch (e) {
                return prompt.edit(replyError(e));
            }
        } else if (getC.customId === "invite") {
            await getC.deferUpdate();
            try {
                await this.guild.setSplash(data.url);
                const emb = new MessageEmbed()
                    .setTitle("Splash Invite stolen!!")
                    .setColor(embColor)
                    .setImage(data.url);
                return prompt.edit({ content: null, embeds: [emb], components: [] });
            } catch (e) {
                return prompt.edit(replyError(e));
            }
        } else if (getC.customId === "discovery") {
            await getC.deferUpdate();
            try {
                await this.guild.setDiscoverySplash(data.url);
                const emb = new MessageEmbed()
                    .setTitle("Splash Discovery stolen!!")
                    .setColor(embColor)
                    .setImage(data.url);
                return prompt.edit({ content: null, embeds: [emb], components: [] });
            } catch (e) {
                return prompt.edit(replyError(e));
            }
        }
    }
}

function clearMes(clMes, timeout = 10000, userMes, defMes) {
    setTimeout(() => {
        if (clMes.channel.permissionsFor(clMes.client.user).has("MANAGE_MESSAGES")) {
            clMes.channel.bulkDelete([clMes, userMes, defMes].filter(r => r));
        } else {
            if (!clMes.deleted && clMes.author.id === clMes.client.user.id) clMes.delete();
            if (defMes && !defMes.deleted && defMes.author.id === defMes.client.user.id) defMes.delete();
        }
    }, timeout);
}