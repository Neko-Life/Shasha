'use strict';

const { BaseModeration } = require("./classes/Moderation");

// ---------------- MODERATION ----------------
// Moderation related functions

/**
 * 
 * @param {import("discord.js").Guild} guild 
 * @returns guild
 */
function loadModeration(guild) {
    if (guild.moderation instanceof BaseModeration) return guild;
    guild.moderation = new BaseModeration(guild.client, guild);
    return guild;
}

module.exports = {
    loadModeration
}