'use strict';

const { MessageEmbed } = require("discord.js");
const { fetchNeko } = require("nekos-best.js");
const emoteMessage = require("../emoteMessage");
const { adCheck, isAdmin } = require("../functions");
const getColor = require("../getColor");

module.exports = async (interaction, query, text, msg, noName) => {
    const member = interaction.member || interaction.user;
    const emb = new MessageEmbed()
        .setAuthor(
            (noName ? '' : (member.displayName || member.username)) + text,
            (member.user || member).displayAvatarURL({ size: 128, format: "png", dynamic: true }))
        .setImage((await fetchNeko(query)).url)
        .setColor(getColor(member.displayColor));
    const desc = emoteMessage(interaction.client, msg);
    if (msg) emb.setDescription(isAdmin(member) ? desc : adCheck(desc));
    return interaction.reply({ embeds: [emb] });
}