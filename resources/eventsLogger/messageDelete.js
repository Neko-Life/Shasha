'use strict';

const { Message } = require("discord.js");
const { trySend, defaultEventLogEmbed, getChannelProchedure, splitOnLength } = require("../functions");
const getColor = require("../getColor");

/**
 * Log message delete event
 * @param {Message} msg
 * @returns 
 */
module.exports = async (msg) => {
    if (msg.partial) return;
    const ignored = msg.guild.eventChannels.message.ignore?.includes(msg.channel.id) ?? false;
    let check = false;
    if (msg.channel.id === msg.guild.eventChannels?.message?.channel && msg.author ? msg.author !== msg.client.user : false && ignored === false) check = true;
    if (msg.guild.eventChannels?.message?.channel !== msg.channel.id && ignored === false || check) {
        const log = getChannelProchedure(msg, msg.guild.eventChannels.message.channel);
        if (!log || !msg.author) return;
        const emb = defaultEventLogEmbed(msg.guild);
        emb.setColor(getColor("yellow"))
        .setTitle("Message " + msg.id + " deleted")
        .setDescription(msg.content.length > 0 ? msg.content : "`[EMPTY]`")
        .setAuthor(emb.author.name, msg.author?.displayAvatarURL({format: "png", size: 4096, dynamic: true}))
        .addField("Author", `<@!${msg.author?.id}>\n\`${msg.author?.tag}\`\n(${msg.author?.id})`,true)
        .addField("Channel", `<#${msg.channel?.id}>\n\`${msg.channel?.name}\`\n(${msg.channel?.id})`,true)
        .setURL(msg.url);
        if (msg.attachments?.array().length > 0) {
            let arr = msg.attachments.array().map(r => r.proxyURL);
            const toField = splitOnLength(arr, 1024);
            for (const add of toField) emb.addField(emb.fields.length === 2 ? "Attachment" : "​", add.join("\n"));
        }
        if (msg.embeds?.[0]) {
            const arr = JSON.stringify(msg.embeds[0], (k, v) => v ?? undefined, 2).replace(/`/g,"\\`").split(",");
            const toField = splitOnLength(arr, 1010, ",\n");
            for (let i = 0; i < toField.length; i++) emb.addField(i === 0 ? "Embed" : "​", "```js\n" + toField[i].join(",") + ((i !== toField.length - 1) ? "," : "") + "```");
        }
        return trySend(msg.client, log, emb);
    }
}
