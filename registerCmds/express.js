'use strict';

const { SlashCommandBuilder, SlashCommandStringOption } = require("@discordjs/builders");
const { EXPRESS_ENDPOINTS } = require("../rsc/constants");

const OPT = new SlashCommandStringOption()
    .setName("expression")
    .setDescription("Your expression")
    .setRequired(true);

for (const U of EXPRESS_ENDPOINTS) {
    OPT.addChoice(U, U);
}

module.exports = new SlashCommandBuilder()
    .setName("express")
    .setDescription("Express yourself")
    .addStringOption(
        opt => OPT
    ).addStringOption(
        opt => opt
            .setName("message")
            .setDescription("Message you want to say")
            .setAutocomplete(true)
    );
