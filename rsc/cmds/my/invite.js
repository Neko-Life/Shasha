"use strict";

const { CommandInteraction } = require("discord.js");
const { Command } = require("../../classes/Command");

module.exports = class InviteCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "invite"
        });
    }

    /**
     * 
     * @param {CommandInteraction} inter 
     * @returns 
     */
    async run(inter) {
        // inter.client.generateInvite({
        //     scope: [
        //         "bot",
        //         "applications.entitlements",
        //         "applications.commands",
        //         "applications.commands.update",
        //         "connections",
        //         "identify",
        //         "guilds",
        //         "guilds.join",
        //         "webhook.incoming",
        //         "gdm.join",
        //         "messages.read"
        //     ], permissions: ["ADMINISTRATOR"], disableGuildSelect: true
        // });
        return inter.reply(`** [INVITE ME ❤️](${!process.dev ? "https://discord.com/oauth2/authorize?client_id=843298069515730944&scope=bot+applications.commands&permissions=8" : "https://discord.com/api/oauth2/authorize?client_id=788006279837909032&permissions=8&scope=applications.commands%20bot"}) **`); // https://discord.com/oauth2/authorize?client_id=843298069515730944&scope=bot+applications.commands&permissions=8
    }
}