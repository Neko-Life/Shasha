'use strict';

const { isInteractionInvoker, replyFalseInvoker } = require("../../functions");

async function handle(inter, args) {
    const pages = inter.client.activeSelectMenus.get(inter.message.id);
    if (!pages) return inter.reply({ content: "This session's expired", ephemeral: true });
    if (!isInteractionInvoker(inter)) {
        // return replyFalseInvoker(inter, "/info server");
        const ePages = {};
        for (const U in pages) {
            const D = pages[U];
            D.ephemeral = true;
            ePages[U] = D;
        }
        await inter.reply(ePages[args[0]]);
        inter.client.activeSelectMenus.set(inter.id, ePages);
    }
    if (!inter.replied) {
        const ret = await inter.message.edit(pages[args[0]]);
        await inter.deferUpdate();
    } else await inter.editReply(pages[args[0]]);
}

module.exports = { handle }