'use strict';

const { MessageEmbed } = require("discord.js");
const { fetchNeko } = require("nekos-best.js");
const { isAdmin, finalizeStr } = require("../functions");
const getColor = require("../getColor");

module.exports = async (interaction, query, user, text, msg) => {
    await interaction.deferReply();
    let from;
    if (user) {
        user = user.member || user.user;
        from = interaction.member || interaction.user;
    } else {
        user = interaction.member || interaction.user;
        from = interaction.guild?.me || interaction.client.user;
    }
    const emb = new MessageEmbed()
        .setAuthor((from.displayName || from.username) + text + (user.displayName || user.username),
            (from.user || from).displayAvatarURL({
                size: 128,
                format: "png",
                dynamic: true
            }))
        .setImage((await fetchNeko(query)).url)
        .setColor(getColor(from.displayColor));
    if (msg) emb.setDescription(finalizeStr(interaction.client, msg, isAdmin(from)));
    return interaction.editReply({ content: `<@${user.id}>`, embeds: [emb] });
}