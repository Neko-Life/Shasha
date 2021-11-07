'use strict';

const { SlashCommandBuilder, SlashCommandStringOption } = require("@discordjs/builders");
const { NSFW_ENDPOINTS } = require("../rsc/constants");

const OPT = new SlashCommandStringOption()
    .setName("category")
    .setDescription("What kind you want? 😳");

for (const U of NSFW_ENDPOINTS) {
    OPT.addChoice(U, U);
}

module.exports = new SlashCommandBuilder()
    .setName("nsfw")
    .setDescription("Have some lewds")
    .addSubcommand(
        sCmd => sCmd
            .setName("image")
            .setDescription("😳")
            .addStringOption(
                opt => OPT
            )
    ).addSubcommand(
        sCmd => sCmd
            .setName("fuck")
            .setDescription("Fuck your partner (they want it ofc 😳)")
            .addUserOption(
                opt => opt
                    .setName("partner")
                    .setDescription("Fuck this partner")
            ).addStringOption(
                opt => opt
                    .setName("message")
                    .setDescription("Message you want to say")
            )
    )