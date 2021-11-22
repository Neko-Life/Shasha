'use strict';

const { SelectMenuInteraction } = require("discord.js");
const { isInteractionInvoker, disableMessageComponents } = require("../../functions");

/**
 * 
 * @param {SelectMenuInteraction} inter 
 * @param {string[]} args 
 * @returns 
 */
async function handle(inter, args) {
    const pages = inter.client.activeMessageInteractions.get(inter.message.id);
    if (!pages) {
        await disableMessageComponents(inter.message);
        return inter.reply({ content: "This session's expired", ephemeral: true });
    }
    if (!isInteractionInvoker(inter)) {
        // Send ephemeral message contain selected info
        const send = pages.PAGES[args[0]];
        delete send.components;
        send.ephemeral = true;
        return inter.reply(send);

        // Default behavior
        // return replyFalseInvoker(inter, "/info server");

        // If it were able to fetch the reply ephemeral message, this would be cool
        // const ePages = {};
        // for (const U in pages) {
        //     ePages[U] = pages[U];
        //     ePages[U].ephemeral = true;
        // }
        // const mes = await inter.reply(ePages[args[0]]);
        // inter.client.createMessageInteraction(mes.id, ePages);
        // return mes;
    }
    if (pages.CURRENT_PAGE) {
        pages.CURRENT_PAGE = args[0];
        inter.client.createMessageInteraction(inter.message.id, pages);
    }
    if (!(inter.replied || inter.deferred)) {
        await inter.message.edit(pages.PAGES[args[0]]);
        await inter.deferUpdate();
    } else await inter.editReply(pages.PAGES[args[0]]);
}

module.exports = { handle }