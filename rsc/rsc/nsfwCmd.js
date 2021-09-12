'use strict';

const { MessageEmbed } = require("discord.js");
const { LewdClient } = require('lewds.api');
const lewds = new LewdClient({ KEY: require("../../config.json").lewdsAPIkey })
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
	lewds.nsfw(query).then(result =>{
    const emb = new MessageEmbed()
        .setAuthor((user.displayName || user.username),
            (user.user || user).displayAvatarURL({
                size: 128,
                format: "png",
                dynamic: true
            }))
        .setImage(result)
        .setColor(getColor(from.displayColor));
  if (!interaction.channel.nsfw) return interaction.reply("This channel is not marked as NSFW, Baka!")
    return interaction.reply({ content: `<@${user.id}>`, embeds: [emb] });
	})
}
