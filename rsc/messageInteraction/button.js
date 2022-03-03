"use strict";

const { ButtonInteraction } = require("discord.js");
const { CommandSettingsHelper } = require("../classes/CommandSettingsHelper");
const { MessageConstructor } = require("../classes/MessageConstructor");
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
            if (!path[1])
                return;
            else return interaction.reply({ content: "Can't find that command, i think kanna nommed it", ephemeral: true });
        this[path[0]](interaction, path.slice(1));
    }

    /**
     * 
     * @param {ButtonInteraction} inter 
     */
    static async page(inter, args) {
        const pages = inter.client.activeMessageInteractions.get(inter.message.id);
        if (!pages) {
            disableMessageComponents(inter.message);
            return inter.reply({ content: "This session's expired", ephemeral: true });
        }
        if (typeof pages.CURRENT_PAGE !== "string"
            && typeof pages.CURRENT_PAGE !== "number")
            throw new Error("No CURRENT_PAGE set");

        let page;
        if (Array.isArray(pages.PAGES)) {
            page = this.getNewPage(args[0], pages.CURRENT_PAGE, pages.PAGES.length);
        } else {
            const k = Object.keys(pages.PAGES);
            let cP = k.indexOf(pages.CURRENT_PAGE);
            cP = this.getNewPage(args[0], cP, k.length);
            page = k[cP];
        }
        if (!isInteractionInvoker(inter)) {
            // Send ephemeral message contain selected info
            const send = typeof pages.PAGES[page] === "function"
                ? await pages.PAGES[page]()
                : pages.PAGES[page];
            delete send.components;
            send.ephemeral = true;
            return inter.reply(send);
        }
        logDev(pages, page);
        pages.CURRENT_PAGE = page;
        inter.client.createMessageInteraction(inter.message.id, pages);
        inter.message.edit(
            typeof pages.PAGES[page] === "function"
                ? await pages.PAGES[page]()
                : pages.PAGES[page]
        );
        inter.deferUpdate();
    }

    /**
     * 
     * @param {"prev"|"next"|"home"} key 
     * @param {number} currentPage 
     * @param {number} length 
     */
    static getNewPage(key, currentPage, length) {
        if (key === "home") return currentPage = 0;
        else if (key === "next")
            if (currentPage === length - 1)
                currentPage = 0;
            else currentPage++;
        else if (key === "prev")
            if (currentPage === 0)
                currentPage = length - 1;
            else currentPage--;
        return currentPage;
    }

    static async settings(inter, args) {
        let message;
        if (inter.message.reference?.messageId)
            message = inter.channel.messages.resolve(inter.message.reference.messageId);
        else message = inter.message;
        if (!isInteractionInvoker(inter))
            return inter.reply({ content: "Wha?! eh? ehmmm etto, anata ha dare?", ephemeral: true });
        else if (args.join("/") === "command/close")
            return CommandSettingsHelper.close(inter);
        else if (!message.buttonHandler) {
            disableMessageComponents(inter.message);
            return inter.reply({ content: "This session's expired", ephemeral: true });
        } else {
            message.buttonHandler[args.shift()](inter, args);
        }
    }

    /**
     * 
     * @param {ButtonInteraction} inter 
     * @param {*} args 
     * @returns 
     */
    static async messageConstructor(inter) {
        if (!isInteractionInvoker(inter))
            return inter.reply({ content: "no UwU", ephemeral: true });
        const construct = new MessageConstructor(inter);
        return construct.start(inter.customId.endsWith("edit"));
    }

    static async constructCheck(inter) {
        const check = isInteractionInvoker(inter);
        if (check === undefined) {
            disableMessageComponents(inter.message);
            return inter.reply({ content: "This session's expired", ephemeral: true });
        } else if (check === false)
            return inter.reply({ content: "DON'T DISTURB the admin pls they tryna make the best server for you here", ephemeral: true });
        return check;
    }

    static async messageConstruct(inter, args) {
        if (await ButtonHandler.constructCheck(inter) !== true) return;
        return inter.message.messageConstruct[args.shift()](inter, args);
    }

    static async embedConstruct(inter, args) {
        if (await ButtonHandler.constructCheck(inter) !== true) return;
        return inter.message.embedConstruct[args.shift()](inter, args);
    }
}
