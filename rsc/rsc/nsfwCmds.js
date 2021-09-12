'use strict';

const { MessageEmbed } = require("discord.js");
const { LewdClient } = require('lewds.api');
const lewds = new LewdClient({ KEY: "Your-API-Key-Here" })
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
        .setAuthor((user.displayName || user.username),
            (user.user || user).displayAvatarURL({
                size: 128,
                format: "png",
                dynamic: true
            }))
        .setImage((await lewds.nsfw(query)).url)
        .setColor(getColor(from.displayColor));
  if (!interaction.channel.nsfw) return interaction.reply("This channel is not marked as NSFW, Baka!")
    return interaction.reply({ content: `<@${user.id}>`, embeds: [emb] });
}
