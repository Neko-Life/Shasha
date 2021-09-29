'use strict';

const { MessageEmbed } = require("discord.js");
const { fetchNeko } = require("nekos-best.js");
const { isAdmin } = require("../functions");
const getColor = require("../getColor");

module.exports = async (interaction, query, text, msg, noName) => {
    await interaction.deferReply();
    const member = interaction.member || interaction.user;
    const emb = new MessageEmbed()
        .setAuthor(
            (noName ? '' : (member.displayName || member.username)) + text,
            (member.user || member).displayAvatarURL({ size: 128, format: "png", dynamic: true }))
        .setImage((await fetchNeko(query)).url)
        .setColor(getColor(member.displayColor));
    if (msg) emb.setDescription(interaction.client.finalizeStr(msg, isAdmin(member)));
    return interaction.editReply({ embeds: [emb] });
}