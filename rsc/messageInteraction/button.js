'use strict';

const { ButtonInteraction } = require("discord.js");
const { logDev } = require("../debug");
const { disableMessageComponents, isInteractionInvoker } = require("../functions");

module.exports = class ButtonHandler {
    /**
     * 
     * @param {ButtonInteraction} inter 
     */
    static handle(interaction) {
        let path = interaction.customId.split("/");
        if (!this[path[0]])
            return interaction.reply("Can't find that command, i think kanna nommed it");
        this[path[0]](interaction, path.slice(1));
    }

    /**
     * 
     * @param {ButtonInteraction} inter 
     */
    static async page(inter, args) {
        const pages = inter.client.activeMessageInteractions.get(inter.message.id);
        if (!pages) {
            await disableMessageComponents(inter.message);
            return inter.reply({ content: "This session's expired", ephemeral: true });
        }
        if (typeof pages.CURRENT_PAGE !== "string"
            && typeof pages.CURRENT_PAGE !== "number")
            throw new Error("No CURRENT_PAGE set");

        let page;
        if (Array.isArray(pages.PAGES)) {
            pages.CURRENT_PAGE
                = page
                = this.getNewPage(args[0], pages.CURRENT_PAGE, pages.PAGES.length);
        } else {
            const k = Object.keys(pages.PAGES);
            let cP = k.indexOf(pages.CURRENT_PAGE);
            cP = this.getNewPage(args[0], cP, k.length);
            pages.CURRENT_PAGE = page = k[cP];
        }
        if (!isInteractionInvoker(inter)) {
            // Send ephemeral message contain selected info
            const send = pages.PAGES[page];
            delete send.components;
            send.ephemeral = true;
            return inter.reply(send);
        }
        logDev(pages, page);
        inter.client.createMessageInteraction(inter.message.id, pages);
        await inter.message.edit(pages.PAGES[page]);
        await inter.deferUpdate();
    }

    /**
     * 
     * @param {"prev"|"next"} key 
     * @param {number} currentPage 
     * @param {number} length 
     */
    static getNewPage(key, currentPage, length) {
        if (key === "next")
            if (currentPage === length - 1)
                currentPage = 0;
            else currentPage++;
        else if (key === "prev")
            if (currentPage === 0)
                currentPage = length - 1;
            else currentPage--;
        return currentPage;
    }
}