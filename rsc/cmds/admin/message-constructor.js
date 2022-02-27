"use strict";

const { MessageActionRow, MessageButton } = require("discord.js");
const { Command } = require("../../classes/Command");

const message = "Welcome to message constructor! You can use this feature to **create** or **edit** select menus, buttons, with role command or actions on click! Or just simply to create the good ol rules embed for your rules channel! Fully customizable to your server needs. Feel free to experiment!";
const button = new MessageActionRow()
    .addComponents([
        new MessageButton()
            .setCustomId("messageConstructor")
            .setStyle("PRIMARY")
            .setLabel("Create Message"),
        new MessageButton()
            .setCustomId("messageConstructor/edit")
            .setStyle("PRIMARY")
            .setLabel("Edit Message"),
    ]);

module.exports = class MessageConstructorCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "message-constructor",
            userPermissions: ["ADMINISTRATOR"],
            clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "READ_MESSAGE_HISTORY"],
            guildOnly: true
        });
    }
    async run(inter) {
        return inter.reply({ content: message, components: [button] });
    }
}
