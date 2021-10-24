'use strict';

const { SlashCommandBuilder, SlashCommandStringOption } = require("@discordjs/builders");
const NSFW_ENDPOINTS = ["ass", "athighs", "blow", "boobs", "feet", "furfuta", "furgif", "futa", "gifs", "hboobs", "hentai", "hfeet", "jackopose", "milk", "pantsu", "sex", "slime", "trap", "yuri"];

const OPT = new SlashCommandStringOption()
    .setName("category")
    .setDescription("Category");

for (const U of NSFW_ENDPOINTS) {
    OPT.addChoice(U, U);
}

module.exports = new SlashCommandBuilder()
    .setName("nsfw")
    .setDescription("Have some lewds")
    .addStringOption(
        opt => OPT
    );
