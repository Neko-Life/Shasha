'use strict';

const { SlashCommandBuilder, SlashCommandStringOption } = require("@discordjs/builders");
const { INTERACT_ENDPOINTS } = require("../rsc/constants");

const OPT = new SlashCommandStringOption()
    .setName("interaction")
    .setDescription("Your interaction")
    .setRequired(true);

for (const U of INTERACT_ENDPOINTS) {
    OPT.addChoice(U, U);
}

module.exports = new SlashCommandBuilder()
    .setName("interact")
    .setDescription("Interact with your friends")
    .addStringOption(
        opt => OPT
    ).addUserOption(
        opt => opt
            .setName("user")
            .setDescription("User to interact with")
    ).addStringOption(
        opt => opt
            .setName("message")
            .setDescription("Message you want to say")
            .setAutocomplete(true)
    );
