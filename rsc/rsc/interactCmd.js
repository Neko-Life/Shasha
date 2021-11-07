'use strict';

const { MessageEmbed, CommandInteraction, GuildMember, User } = require("discord.js");
const { fetchNeko } = require("nekos-best.js");
const lewds = require("./lewds");
const { isAdmin, getColor } = require("../functions");
const { loadDb } = require("../database");

/**
 * 
 * @param {CommandInteraction} interaction 
 * @param {string | {name: string, query: string}} query - API query
 * @param {{member: GuildMember, user: User}} user - Target
 * @param {string} text - Text between author name and target name [" kisses ", " spanked "]
 * @param {string} msg - Invoker message
 * @param {boolean} noCount - Doesn't count the interaction if true
 * @param {"lewds" | "nekos.best"} api - API to use, default "nekos.best"
 * @returns 
 */
module.exports = async (interaction, query, user, text, msg, noCount, api = "nekos.best") => {
    await interaction.deferReply();
    const q = query.query;
    if (typeof query === "object") query = query.name;
    const res = api === "lewds" ? await lewds.nsfw(q || query) : await fetchNeko(q || query);
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
        .setColor(getColor(from.displayColor));

    if (msg) emb.setDescription(interaction.client.finalizeStr(msg, isAdmin(from)));

    if (!noCount) {
        loadDb(from, "user/" + from.id);
        const fetInters = await from.db.getOne("interactions", "Object");
        const interactionDatas = fetInters?.value || {};

        if (typeof interactionDatas[query] !== "number")
            interactionDatas[query] = 0;
        interactionDatas[query]++;

        from.db.set("interactions", "Object", { value: interactionDatas });

        let countText;
        const num = interactionDatas[query];
        const numStr = num.toString();
        if (num === 1) countText = "First";
        else if (num === 2) countText = "Second";
        else if (num === 3) countText = "Third";
        else if (numStr.endsWith("1")) {
            if (numStr.endsWith("11")) countText = numStr + "st";
        } else if (numStr.endsWith("2")) {
            if (numStr.endsWith("12")) countText = numStr + "nd";
        } else if (numStr.endsWith("3")) {
            if (numStr.endsWith("13")) countText = numStr + "rd";
        }

        if (!countText) countText = numStr + "th";

        emb.setFooter(`${countText} ${query} from ${from.displayName || from.username}`);
    }
    if (!res) return interaction.editReply("Oops sorry no room left, can't " + query + " today 😔😔😔");
    emb.setImage(res?.url || res);
    return interaction.editReply({ content: `<@${user.id}>`, embeds: [emb] });
}