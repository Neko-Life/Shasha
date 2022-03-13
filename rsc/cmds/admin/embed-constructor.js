"use strict";

const { MessageActionRow, MessageButton } = require("discord.js");
const { Command } = require("../../classes/Command");

const components = [
    new MessageActionRow().addComponents([
        new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/start").setLabel("Create"),
        new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/start/edit").setLabel("Edit"),
    ]),
];

module.exports = class EmbedConstructorCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "embed-constructor",
            description: "Create or edit embed",
            userPermissions: ["ADMINISTRATOR"],
            clientPermissions: ["VIEW_CHANNEL", "EMBED_LINKS", "READ_MESSAGE_HISTORY", "SEND_MESSAGES"],
        });
    }

    async run(inter) {
        return inter.reply({ content: "Welcome to embed constructor! With this command you can create or edit embeds of a message! Feel free to experiment and create some beautiful rules embed!", components });
    }
}
