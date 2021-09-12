'use strict';

const { MessageEmbed } = require("discord.js");
const { fetchNeko } = require("nekos-best.js");
const emoteMessage = require("../emoteMessage");
const { adCheck, isAdmin } = require("../functions");
const getColor = require("../getColor");

module.exports = async (interaction, query, user, text, msg) => {
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
    const desc = emoteMessage(interaction.client, msg);
    if (msg) emb.setDescription(isAdmin(from) ? desc : adCheck(desc));
    return interaction.reply({ content: `<@${user.id}>`, embeds: [emb] });
}