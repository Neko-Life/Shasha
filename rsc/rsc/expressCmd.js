'use strict';

const { MessageEmbed, CommandInteraction } = require("discord.js");
const { fetchNeko } = require("nekos-best.js");
const { isAdmin } = require("../functions");
const getColor = require("../getColor");

/**
 * 
 * @param {CommandInteraction} interaction 
 * @param {string} query 
 * @param {string} text 
 * @param {string} msg 
 * @param {boolean} noName 
 * @returns 
 */
module.exports = async (interaction, query, text = "", msg, noName) => {
    await interaction.deferReply();
    const member = interaction.member || interaction.user;
    const emb = new MessageEmbed()
        .setImage((await fetchNeko(query)).url)
        .setColor(getColor(member.displayColor));
    const auN = (noName ? '' : (member.displayName || member.username)) + text;
    if (auN.length)
        emb.setAuthor(
            auN,
            (member.user || member).displayAvatarURL({ size: 128, format: "png", dynamic: true }));
    if (msg) emb.setDescription(interaction.client.finalizeStr(msg, isAdmin(member)));
    return interaction.editReply({ embeds: [emb] });
}