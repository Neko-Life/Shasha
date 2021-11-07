'use strict';

const { MessageEmbed } = require("discord.js");
const { getColor } = require("../functions");
const lewds = require("./lewds");

module.exports = async (interaction, query) => {
    await interaction.deferReply();
    const user = interaction.member || interaction.user;
    const URL = await lewds.nsfw(query);
    if (!URL) return interaction.editReply("Oopsie our service is busy, guess you're gonna go dry...");
    const emb = new MessageEmbed()
        .setAuthor((user.displayName || user.username) + "'s " + query + " 😳",
            (user.user || user).displayAvatarURL({
                size: 128,
                format: "png",
                dynamic: true
            }))
        .setImage(URL)
        .setColor(getColor(user.displayColor));
    return interaction.editReply({ embeds: [emb] });
}