'use strict';

const { SlashCommandBuilder, SlashCommandStringOption } = require("@discordjs/builders");
const { INTERACT_ENDPOINTS } = require("../rsc/cmds/nsfw").constant;

const OPT = new SlashCommandStringOption()
    .setName("nsfw")
    .setDescription("NSFW Commands")
    .setRequired(true);

for (const U of INTERACT_ENDPOINTS) {
    OPT.addChoice(U, U);
}

module.exports = new SlashCommandBuilder()
    .setName("nsfw")
    .setDescription("NSFW Commands")
    .addStringOption(
        opt => OPT
    ).addStringOption(
        opt => opt
            .setName("type")
            .setDescription("The kind of nsfw you would like")
    );
