'use strict';

const { MessageEmbed } = require("discord.js");
const { getColor } = require("../functions");
const apis = require("./apis");

module.exports = async (interaction, query) => {
    await interaction.deferReply();
    const user = interaction.member || interaction.user;
    const { res } = await apis(query, "lewds");
    if (!res) return interaction.editReply("Oopsie our service is busy, guess you're gonna go dry...");
    const emb = new MessageEmbed()
        .setAuthor((user.displayName || user.username) + "'s " + query + " 😳",
            (user.user || user).displayAvatarURL({
                size: 128,
                format: "png",
                dynamic: true
            }))
        .setImage(res)
        .setColor(getColor(user.displayColor));
    return interaction.editReply({ embeds: [emb] });
}