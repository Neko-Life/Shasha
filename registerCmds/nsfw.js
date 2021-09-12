'use strict';

const { SlashCommandBuilder } = require("@discordjs/builders");
const { INTERACT_ENDPOINTS } = require("../rsc/cmds/nsfw").constant;

const CMD = new SlashCommandBuilder()
    .setName("nsfw")
    .setDescription("Get some lewds");

for (const IE of INTERACT_ENDPOINTS) {
    CMD.addSubcommand(
        sCmd => sCmd
            .setName(IE)
            .setDescription("NSFW Commands")
	)
);
}

module.exports = CMD
