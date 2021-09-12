'use strict';

const { SlashCommandBuilder, SlashCommandStringOption } = require("@discordjs/builders");
const { NSFW_ENDPOINTS } = require("../rsc/cmds/nsfw").constant;

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
