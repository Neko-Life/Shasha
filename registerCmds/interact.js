'use strict';

const { SlashCommandBuilder } = require("@discordjs/builders");
const { INTERACT_DESCRIPTIONS, INTERACT_ENDPOINTS } = require("../rsc/cmds/interact").constant;

const CMD = new SlashCommandBuilder()
    .setName("interact")
    .setDescription("Interact with your friends");

for (const IE of INTERACT_ENDPOINTS) {
    CMD.addSubcommand(
        sCmd => sCmd
            .setName(IE)
            .setDescription(INTERACT_DESCRIPTIONS[IE])
            .addUserOption(
                opt => opt
                    .setName("user")
                    .setDescription("User to interact with")
                    .setRequired(true)
            ).addStringOption(
                opt => opt
                    .setName("message")
                    .setDescription("Message you want to say")
            )
    );
}

module.exports = CMD