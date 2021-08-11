'use strict';

const { Message } = require("discord.js");
const { trySend, defaultEventLogEmbed, getChannel, splitOnLength } = require("../functions");
const getColor = require("../getColor");

/**
 * Log message delete event
 * @param {Message} msg
 * @returns 
 */
module.exports = async (msg) => {
    if (msg.partial) return;
    const dateNow = new Date();
    if (msg.guild) {
        if (!msg.guild.DB) await msg.guild.dbLoad();
        msg.guild.updateCached("systemChannelID", msg.guild.systemChannelID);
        msg.guild.updateCached("iconURL", msg.guild.iconURL({ size: 4096, format: "png", dynamic: true }));
    }
    const ignored = msg.guild.DB.eventChannels.mesDel?.ignore?.includes(msg.channel.id) || false;
    let check = false;
    if (msg.channel.id === msg.guild.DB.eventChannels.mesDel?.channel && (msg.author ? msg.author !== msg.client.user : false) && ignored === false) check = true;
    if (msg.guild.DB.eventChannels.mesDel?.channel !== msg.channel.id && ignored === false || check) {
        const log = getChannel(msg, msg.guild.DB.eventChannels.mesDel?.channel);
        if (!log || !msg.author) return;
        const emb = defaultEventLogEmbed(msg.guild);
        let audit = {};
        if (msg.guild.member(msg.client.user).hasPermission("VIEW_AUDIT_LOG")) {
            const col = await msg.guild.fetchAuditLogs({ type: "MESSAGE_DELETE" });
            const colFilter = col.entries.filter((r) => r.target.id === msg.author.id &&
                r.extra.channel.id === msg.channel.id &&
                (dateNow.valueOf() - r.createdTimestamp) < 60000);
            audit = colFilter.first() || {};
            console.log; // BREAKPOINT
        }
        emb.setColor(getColor("yellow"))
            .setTitle((!msg.webhookID ? "Message " + msg.id : "Webhook " + msg.webhookID) + " deleted" + (audit?.executor ? ` by ${audit.executor.bot ? "`[BOT]` " : ""}\`${audit.executor.tag}\`` : ""))
            .setDescription(msg.content.length > 0 ? msg.content : "`[EMPTY]`")
            .setURL(msg.url)
            .setFooter(emb.footer.text || "​", msg.author.displayAvatarURL({ size: 128, format: "png", dynamic: true }));
        if (audit.executor)
            emb.setAuthor(emb.author.name, audit.executor.displayAvatarURL({ size: 128, format: "png", dynamic: true }));
        if (msg.attachments?.size > 0) {
            let arr = msg.attachments.map(r => r.proxyURL);
            const toField = splitOnLength(arr, 1024);
            for (const add of toField) emb.addField(emb.fields.length === 2 ? "Attachment" : "​", add.join("\n"));
        }
        if (msg.embeds?.[0]) {
            const arr = JSON.stringify(msg.embeds[0], (k, v) => v || undefined, 2).replace(/```/g, "`\\``").split(",");
            const toField = splitOnLength(arr, 1010, ",\n");
            for (let i = 0; i < toField.length; i++) emb.addField(i === 0 ? "Embed" : "​", "```js\n" + toField[i].join(",") + ((i !== toField.length - 1) ? "," : "") + "```");
        }
        emb.addField("Author", `<@!${msg.author?.id}>\n\`${msg.author?.tag}\`\n(${msg.author?.id})`, true)
            .addField("Channel", `<#${msg.channel?.id}>\n\`${msg.channel?.name}\`\n(${msg.channel?.id})`, true);
        if (audit.executor?.bot) emb.addField("Reason", audit.reason || "No reason provided");
        if (audit.executor) emb.addField("Moderator", `<@${audit.executor.id}>\n(${audit.executor.id})`);
        return trySend(msg.client, log, emb);
    }
}
