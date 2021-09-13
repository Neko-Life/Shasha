'use strict';

const { MessageEmbed } = require("discord.js");
const { LewdClient } = require('lewds.api');
const lewds = new LewdClient({ KEY: require("../../config.json").lewdsAPIkey })
const getColor = require("../getColor");

module.exports = async (interaction, query) => {
    const user = interaction.member || interaction.user;
    const URL = await lewds.nsfw(query);
    if (!URL) return interaction.reply("Oopsie our service is busy, guess you're gonna go dry...");
    const emb = new MessageEmbed()
        .setAuthor((user.displayName || user.username) + "'s " + query + " 😳",
            (user.user || user).displayAvatarURL({
                size: 128,
                format: "png",
                dynamic: true
            }))
        .setImage(URL)
        .setColor(getColor(user.displayColor));
    return interaction.reply({ embeds: [emb] });
}
