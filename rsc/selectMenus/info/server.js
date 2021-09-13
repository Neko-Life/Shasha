'use strict';

const { SelectMenuInteraction } = require("discord.js");
const { isInteractionInvoker } = require("../../functions");

/**
 * 
 * @param {SelectMenuInteraction} inter 
 * @param {*} args 
 * @returns 
 */
async function handle(inter, args) {
    const pages = inter.client.activeSelectMenus.get(inter.message.id);
    if (!pages) return inter.reply({ content: "This session's expired", ephemeral: true });
    if (!isInteractionInvoker(inter)) {
        // Send ephemeral message contain selected info
        const send = pages[args[0]];
        delete send.components;
        send.ephemeral = true;
        return inter.reply(send);

        // Default behavior
        // return replyFalseInvoker(inter, "/info server");

        // If it were able to fetch the reply ephemeral message, this would be cool
        // const ePages = {};
        // for (const U in pages) {
        //     const D = pages[U];
        //     D.ephemeral = true;
        //     D.fetchReply = true;
        //     ePages[U] = D;
        // }
        // const mes = await inter.reply(ePages[args[0]]);
        // inter.client.activeSelectMenus.set(mes.id, ePages);
    }
    if (!inter.replied) {
        const ret = await inter.message.edit(pages[args[0]]);
        await inter.deferUpdate();
    } else await inter.editReply(pages[args[0]]);
}

module.exports = { handle }