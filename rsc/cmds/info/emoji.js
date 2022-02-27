"use strict";

const { MessageEmbed, MessageActionRow, MessageSelectMenu, CommandInteraction } = require("discord.js");
const { Command } = require("../../classes/Command");
const { strYesNo, unixToSeconds, getColor } = require("../../functions");
const { intervalToStrings, createInterval } = require("../../util/Duration");

module.exports = class InfoEmojiCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "infoemoji",
            description: "Show emoji info",
            autocomplete: {
                matchName: false,
                commands: {
                    emoji: Command.constructCommandEmoteAutocomplete(interaction)
                },
                preview: false
            },
            clientPermissions: ["EMBED_LINKS", "VIEW_CHANNEL"]
        });
    }
    /**
     * 
     * @param {CommandInteraction} inter 
     * @param {*} param1 
     * @returns 
     */
    async run(inter, { emoji }) {
        let find = this.client.emojis.resolve(emoji.value.match(/\d{17,20}/)?.[0] || emoji.value);
        if (!find) {
            const reF = emoji.value.match(/[a-z0-9-_]{1,32}/i)?.[0];
            if (!reF) return inter.reply("Invalid input. Provide emoji name, Id, or the emoji itself");
            find = this.client.emojis.cache.filter(r => r.name.toLowerCase() === reF.toLowerCase())?.first();
            if (!find) return inter.reply("Can't find that emoji :c");
        }
        const baseEmbed = new MessageEmbed()
            .setAuthor({ name: find.name, iconURL: find.url })
            .setColor(getColor(this.user.accentColor, true) || getColor(this.member.displayColor, true));
        const emb = new MessageEmbed(baseEmbed)
            .addField("Identifier", `\`${find.name}\`\n(${find.id})`)
            .addField("Registered", `<t:${unixToSeconds(
                find.createdTimestamp
            )}:F>\n(${intervalToStrings(
                createInterval(find.createdAt, new Date())
            ).strings.join(" ")})`)
            .addField("Server", `\`${find.guild.name}\``)
            .addField("Animated", strYesNo(find.animated), true)
            .addField("Available", strYesNo(find.available), true)
            .addField("Managed by Discord", strYesNo(find.managed), true);
        const jumboEmb = new MessageEmbed(baseEmbed)
            .setImage(find.url);

        const menu = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId("pages")
                    .setMaxValues(1)
                    .setPlaceholder("Browse...")
                    .setOptions([
                        { label: "Info", value: "infoPage", description: "General info" },
                        { label: "Image", value: "imagePage", description: "Jumbo emoji image" }
                    ])
            );

        const selectMenuDatas = {
            infoPage: {
                embeds: [emb],
                components: [menu]
            },
            imagePage: {
                embeds: [jumboEmb],
                components: [menu]
            }
        }
        const mes = await inter.reply({ ...selectMenuDatas.infoPage, fetchReply: true });
        this.client.createMessageInteraction(mes.id, { PAGES: selectMenuDatas });
        return mes;
    }
}
