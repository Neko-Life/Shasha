"use strict";

const { loadDb } = require("../database");
const { logDev } = require("../debug");

async function handle(interaction) {
    if (!interaction.message) throw new TypeError("No message in action interaction, something's wrong");
    /** @type {import("../typins").ShaMessage} */
    logDev({ action: interaction });
    const message = loadDb(interaction.message, `message/${interaction.channelId}/${interaction.message.id}`)
    const get = await message.db.getOne("action", interaction.customId);
    const data = get?.value;
    if (!data) return;
    const actions = data?.actions;
    if (!actions?.length) return;
    const settings = data?.settings;
    for (const act of actions) {
        logDev({ actionData: act });
        if (!act) return;
        await interaction.client.triggerActions[act.type]({ ...act, interaction, guild: interaction.guild, target: interaction.member });
    }
}

module.exports = { handle }
