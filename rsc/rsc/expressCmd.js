'use strict';

const { MessageEmbed, CommandInteraction } = require("discord.js");
const { NEKOSLIFE_INTERACT_ENDPOINTS } = require("../constants");
const { isAdmin, getColor } = require("../functions");
const apis = require("./apis");

/**
 * 
 * @param {CommandInteraction} interaction 
 * @param {string} query 
 * @param {string} text 
 * @param {string} msg 
 * @param {boolean} noName 
 * @param {import("./apis").ShaAPIs} api
 * @returns 
 */
module.exports = async (interaction, query, text = "", msg, noName, api = "nekosbest") => {
    await interaction.deferReply();
    if (NEKOSLIFE_INTERACT_ENDPOINTS.includes(query))
        api = ["nekosbest", "nekoslife.sfw"][Math.floor(Math.random() * 2)];

    const { res, APIError } = await apis(query, api);

    if (APIError) return interaction.editReply(APIError);

    const member = interaction.member || interaction.user;
    const emb = new MessageEmbed()
        .setImage(res)
        .setColor(getColor(member.displayColor));
    const auN = (noName ? '' : (member.displayName || member.username)) + text;

    if (auN.length)
        emb.setAuthor(
            auN,
            member.displayAvatarURL(
                { size: 128, format: "png", dynamic: true }
            )
        );

    if (msg) emb.setDescription(interaction.client.finalizeStr(msg, isAdmin(member, true)));
    return interaction.editReply({ embeds: [emb] });
}