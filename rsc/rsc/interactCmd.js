'use strict';

const { MessageEmbed, CommandInteraction, GuildMember, User } = require("discord.js");
const { isAdmin, getColor, replaceVars } = require("../functions");
const { loadDb } = require("../database");
const apis = require("./apis");
const { NEKOSLIFE_INTERACT_ENDPOINTS, INTERACT_NO_INCLUDE_TARGET_NAMES } = require("../constants");

/**
 * 
 * @param {CommandInteraction} interaction 
 * @param {string | {name: string, query: string}} query - API query
 * @param {{member: GuildMember, user: User}} user - Target
 * @param {string} text - Text between author name and target name [" kisses ", " spanked "]
 * @param {string} msg - Invoker message
 * @param {boolean} noCount - Doesn't count the interaction if true
 * @param {import("./apis").ShaAPIs} api - API to use, default "nekosbest"
 * @returns 
 */
module.exports = async (interaction, query, user, text, msg, noCount, api = "nekosbest") => {
    await interaction.deferReply();
    const q = query.query || query;
    if (query.name) query = query.name;
    if (NEKOSLIFE_INTERACT_ENDPOINTS.includes(query))
        api = ["nekosbest", "nekoslife.sfw"][Math.floor(Math.random() * 2)];
    const { res, APIError } = await apis(q, api);

    if (APIError) return interaction.editReply(APIError);

    let from;
    if (user) {
        user = user.member || user.user;
        from = interaction.member || interaction.user;
    } else {
        user = interaction.member || interaction.user;
        from = interaction.guild?.me || interaction.client.user;
    }

    if (text) text = replaceVars(text, { user });

    const emb = new MessageEmbed()
        .setAuthor((from.displayName || from.username) + text
            + (INTERACT_NO_INCLUDE_TARGET_NAMES.includes(query)
                ? ""
                : (user.displayName || user.username)),
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
            if (!numStr.endsWith("11")) countText = numStr + "st";
        } else if (numStr.endsWith("2")) {
            if (!numStr.endsWith("12")) countText = numStr + "nd";
        } else if (numStr.endsWith("3")) {
            if (!numStr.endsWith("13")) countText = numStr + "rd";
        }

        if (!countText) countText = numStr + "th";

        emb.setFooter(`${countText} ${query} from ${from.displayName || from.username}`);
    }

    emb.setImage(res);

    return interaction.editReply({ content: `<@${user.id}>`, embeds: [emb] });
}