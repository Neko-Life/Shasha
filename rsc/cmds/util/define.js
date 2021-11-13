'use strict';

const { Command } = require("../../classes/Command");
const ud = require("urban-dictionary");
const { MessageEmbed, MessageActionRow, MessageButton, Message } = require("discord.js");
const { getColor } = require("../../functions");
const { logDev } = require("../../debug");
const ascii = "[```\n    _|_  _  _    _|. __|_. _  _  _  _\n|_|| |_)(_|| |  (_||(_ | |(_)| |(_|| \\/\n                                     /```](https://www.urbandictionary.com/)";

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
            .setColor(getColor(this.user.accentColor, true) || getColor(this.member?.displayColor, true));
        const av = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/UD_logo-01.svg/512px-UD_logo-01.svg.png";

        const button = new MessageActionRow()
            .addComponents([
                new MessageButton().setCustomId("prev").setEmoji("⬅️").setStyle("PRIMARY"),
                new MessageButton().setCustomId("next").setEmoji("➡️").setStyle("PRIMARY")
            ]);

        for (const v of defined) {
            const def = v.definition.length > 2000
                ? v.definition.slice(0, 1997) + "..."
                : v.definition;
            const ex = v.example.length > 1024
                ? v.example.slice(0, 1021) + "..."
                : v.example;
            const page = new MessageEmbed(baseEmbed)
                .setAuthor(v.author, av)
                .setTitle(v.word)
                .setURL(v.permalink)
                .setDescription(def)
                .setFooter(`👍 ${v.thumbs_up} | 👎 ${v.thumbs_down}`)
                .setTimestamp(v.written_on);
            if (ex) page.addField("Example", ex);
            pages.push({
                embeds: [page.addField("​", ascii)],
                components: [button]
            });
        }
        let cPage = 0;
        /**
         * @type {Message}
         */
        const mes = await inter.editReply(pages[cPage]);
        const col = mes.createMessageComponentCollector({ filter: (i) => i.user.id === inter.user.id });
        col.on("collect", (i) => {
            i.deferUpdate();
            if (i.customId === "next") {
                if (cPage >= pages.length - 1) cPage = -1;
                mes.edit(pages[++cPage]);
            } else {
                if (cPage <= 0) cPage = pages.length;
                mes.edit(pages[--cPage]);
            }
        });
        return mes;
    }
}