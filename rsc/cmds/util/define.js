'use strict';

const { Command } = require("../../classes/Command");
const ud = require("urban-dictionary");
const { MessageEmbed, MessageActionRow, MessageButton, Message } = require("discord.js");
const { getColor } = require("../../functions");
const { logDev } = require("../../debug");
const ascii = "[```\n    _|_  _  _    _|. __|_. _  _  _  _\n|_|| |_)(_|| |  (_||(_ | |(_)| |(_|| \\/\n                                     /```](https://www.urbandictionary.com/)";
const thumb = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/UD_logo-01.svg/512px-UD_logo-01.svg.png";

module.exports = class DefineCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "define",
            clientPermissions: ["VIEW_CHANNEL", "EMBED_LINKS"]
        });
    }
    async run(inter, { term }) {
        await inter.deferReply();
        const defined = await ud[term ? "define" : "random"](term?.value).catch(logDev);
        if (!defined) return inter.editReply("Nothin found :c");
        const pages = [];
        const baseEmbed = new MessageEmbed()
            .setThumbnail(thumb)
            .setColor(getColor(this.user.accentColor, true) || getColor(this.member?.displayColor, true));
        const av = (this.member || this.user).displayAvatarURL({ size: 128, format: "png", dynamic: true })

        const button = new MessageActionRow()
            .addComponents([
                new MessageButton().setCustomId("prev").setEmoji("⬅️").setStyle("PRIMARY"),
                new MessageButton().setCustomId("next").setEmoji("➡️").setStyle("PRIMARY")
            ]);

        for (const v of defined) {
            const def = v.definition.length > 4000
                ? v.definition.slice(0, 3997) + "..."
                : v.definition;
            const ex = v.example.length > 1024
                ? v.example.slice(0, 1021) + "..."
                : v.example;
            const page = new MessageEmbed(baseEmbed)
                .setAuthor(v.author, av, "https://www.urbandictionary.com/")
                .setTitle(v.word)
                .setURL(v.permalink)
                .setDescription(def)
                .setFooter(`👍 ${v.thumbs_up} | 👎 ${v.thumbs_down}`)
                .setTimestamp(v.written_on);
            if (ex) page.addField("​", ex);
            pages.push({
                embeds: [page/*.addField("​", ascii)*/],
                components: [button]
            });
        }
        let cPage = 0;
        /**
         * @type {Message}
         */
        const mes = await inter.editReply(pages[cPage]);
        const col = mes.createMessageComponentCollector();
        col.on("collect", async (i) => {
            const thisUser = i.user.id === inter.user.id;
            if (thisUser)
                i.deferUpdate();
            let oI;
            if (i.customId === "next") {
                if (thisUser) {
                    if (cPage >= pages.length - 1) cPage = -1;
                    oI = ++cPage;
                } else {
                    let nPage = cPage;
                    if (nPage >= pages.length - 1) nPage = -1;
                    oI = ++nPage;
                }
            } else {
                if (thisUser) {
                    if (cPage <= 0) cPage = pages.length;
                    oI = --cPage;
                } else {
                    let nPage = cPage;
                    if (nPage <= 0) nPage = pages.length;
                    oI = --nPage;
                }
            }
            if (thisUser)
                mes.edit(pages[oI]);
            else {
                const s = pages[oI];
                delete s.components;
                s.ephemeral = true;
                i.reply(s);
            }
        });
        return mes;
    }
}