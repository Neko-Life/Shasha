'use strict';

const { MessageEmbed } = require("discord.js");
const { fetchNeko } = require("nekos-best.js");
const getColor = require("../getColor");

module.exports = async (interaction, query, user, text) => {
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
    return interaction.reply({ content: `<@${user.id}>`, embeds: [emb] });
}