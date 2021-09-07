'use strict';

const { SlashCommandBuilder } = require("@discordjs/builders");
const { EXPRESS_ENDPOINTS, EXPRESS_DESCRIPTIONS } = require("../rsc/cmds/express").constant;

const CMD = new SlashCommandBuilder()
    .setName("express")
    .setDescription("Express yourself");

for (const EP of EXPRESS_ENDPOINTS) {
    CMD.addSubcommand(
        sCmd => sCmd
            .setName(EP)
            .setDescription(EXPRESS_DESCRIPTIONS[EP])
    );
}

module.exports = CMD