"use strict";

const { SelectMenuInteraction } = require("discord.js");
const { isInteractionInvoker, disableMessageComponents } = require("../../functions");

/**
 * 
 * @param {SelectMenuInteraction} inter 
 * @param {string[]} args 
 * @returns 
 */
async function handle(inter, args) {
    const newArgs = [];
    for (const k of args)
        newArgs.push(k.split("/"));
    args = newArgs;
    const pages = inter.client.activeMessageInteractions.get(inter.message.id);
    if (!pages) {
        disableMessageComponents(inter.message);
        return inter.reply({ content: "This session's expired", ephemeral: true });
    }
    if (!isInteractionInvoker(inter)) {
        // Send ephemeral message contain selected info
        const send = typeof pages.PAGES[args[0][0]] === "function"
            ? await pages.PAGES[args[0][0]](inter, args[0].slice(1))
            : pages.PAGES[args[0][0]];
        if (send) {
            delete send.components;
            send.ephemeral = true;
            return inter.reply(send);
        }

        // Default behavior
        // return replyFalseInvoker(inter, "/info server");

        // If it were able to fetch the reply ephemeral message, this would be cool
        // const ePages = {};
        // for (const U in pages) {
        //     ePages[U] = pages[U];
        //     ePages[U].ephemeral = true;
        // }
        // const mes = await inter.reply(ePages[args[0][0]]);
        // inter.client.createMessageInteraction(mes.id, ePages);
        // return mes;
    }
    if (pages.CURRENT_PAGE) {
        pages.CURRENT_PAGE = args[0][0];
        inter.client.createMessageInteraction(inter.message.id, pages);
    }
    if (!(inter.replied || inter.deferred)) {
        inter.message.edit(
            typeof pages.PAGES[args[0][0]] === "function"
                ? await pages.PAGES[args[0][0]](inter, args[0].slice(1))
                : pages.PAGES[args[0][0]]
        );
        if (typeof pages.PAGES[args[0][0]] !== "function") inter.deferUpdate();
    } else inter.editReply(
        typeof pages.PAGES[args[0][0]] === "function"
            ? await pages.PAGES[args[0][0]](inter, args[0].slice(1))
            : pages.PAGES[args[0][0]]
    );
}

module.exports = { handle }