'use strict';

const { MessageEmbed } = require("discord.js");
const { Command } = require("../../classes/Command");

module.exports = class AvatarCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "avatar",
            description: "Show avatar",
            clientPermissions: ["EMBED_LINKS"]
        });
    }

    async run(inter, { user }) {
        if (!user) user = inter.member || inter.user;
        else user = user.member || user.user;
        const emb = new MessageEmbed()
            .setTitle(user.displayName || user.username)
            .setImage(user.user
                ? user.user.displayAvatarURL({ size: 4096, format: "png", dynamic: true })
                : user.displayAvatarURL({ size: 4096, format: "png", dynamic: true }));
        if (user.displayColor) emb.setColor(user.displayColor);
        return inter.reply({ embeds: [emb] });
    }
}