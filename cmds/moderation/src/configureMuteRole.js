'use strict';

const { Message } = require("discord.js");
const { blockChannelUpdateEvents, unblockChannelUpdateEvents } = require("../../../resources/eventsLogger/channelUpdate");
const { trySend, parseDash, defaultImageEmbed, defaultSplitMessage } = require("../../../resources/functions");
const getColor = require("../../../resources/getColor");

module.exports = async (msg, arg) => {
    if (!msg.member.isAdmin) return trySend(msg.client, msg, "<@" + msg.author + "> you're not an Administrator <:nekohmLife:846371737644957786>");
    if (!msg.guild.member(msg.guild.client.user).isAdmin) return trySend(msg.client, msg, "<@" + msg.author + "> i am not an Administrator <:pepewhysobLife:853237646666891274>");
    const args = parseDash(arg);
    if (!args?.[1]) return trySend(msg.client, msg, "Args: `-n role_[name|mention|ID] -c color_[name|number|hex]`");
    let data = { name: "Muted" };
    for (const ARG of args) {
        const U = ARG.slice(2).trim();
        if (ARG.startsWith("n ")) if (U.length > 0) data.name = U;
        if (ARG.startsWith("c ")) if (U.length > 0) data.color = getColor(U);
    }
    if (data.name?.length > 100) return trySend(msg.client, msg, "Role name must be less than 100 characters in length!");
    let emb = defaultImageEmbed(msg, null, "Create Mute Role");
    emb.addField("Name", data.name)
        .setDescription("Respond with **'yes'** if you want to proceed. A new role will be created with the following properties:")
        .addField("Color", "This embed's color");
    if (data.color) emb.setColor(data.color);
    await trySend(msg.client, msg, emb);
    const RR = await msg.channel.awaitMessages((r) => r.author === msg.author, { max: 1, time: 30000 });
    if (RR.first()?.content.toLowerCase() === "yes") return detonate(msg, data); else return trySend(msg.client, msg, "Create Mute Role: **Cancelled**");
}

async function detonate(msg, data) {
    const map = msg.guild.channels.cache.map(r => r);
    const pleaseWait = await trySend(msg.client, msg, `Setting up for ${map.length} channel${map.length < 2 ? "" : "s"}... This message will be edited when done.`);
    data.permissions = 0;
    const ROLE = await msg.guild.roles.create({ data: data, reason: "Create Mute Role" }).catch(() => { });
    msg.guild.DB.settings.mute.role = ROLE.id;
    let cant = [];
    if (ROLE) {
        blockChannelUpdateEvents();
        for (const U of map) {
            await U.updateOverwrite(ROLE, { SEND_MESSAGES: false, CONNECT: false }, "Create Mute Role").catch(() => cant.push(U.id));
        };
        setTimeout(unblockChannelUpdateEvents, 5000);
    } else return pleaseWait.edit("Create Mute Role: Can't create role. Operation cancelled");
    if (cant.length > 0) {
        const split = defaultSplitMessage,
            mes = "**Can't overwrite permissions in:**\n";
        split.append = ",";
        split.prepend = "";
        trySend(msg.client, msg, { content: mes + "<#" + cant.join(">,\n<#") + ">", split: split });
    }
    msg.guild.setDb("settings", msg.guild.DB.settings);
    return pleaseWait.edit(`Create Mute Role: ${ROLE} **Done**`);
}