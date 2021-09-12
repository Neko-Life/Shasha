'use strict';

const { isOwner, isInteractionInvoker } = require("../../functions");

async function handle(inter, args) {
    if (!(await isInteractionInvoker(inter, "/info server"))) return;
    const pages = inter.client.activeSelectMenus.get(inter.message.id);
    if (!pages) return inter.reply({ content: "This session's expired", ephemeral: true });
    const ret = await inter.message.edit(pages[args[0]]);
    await inter.deferUpdate();
}

module.exports = { handle }