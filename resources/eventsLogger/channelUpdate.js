'use strict';

const { GuildChannel, Guild, GuildAuditLogsEntry } = require("discord.js");
const { defaultEventLogEmbed, changed, trySend, wait } = require("../functions");
const getColor = require("../getColor");
let blockChannelUpdate = false;

/**
 * @param {GuildChannel} oldChannel 
 * @param {GuildChannel} newChannel 
 */
async function run(oldChannel, newChannel) {
    await wait(4000);
    const dateNow = new Date();
    if (!newChannel.guild.DB) await newChannel.guild.dbLoad();
    if (!newChannel.guild.DB.eventChannels?.guild) return;
    const logChannel = newChannel.guild.channels.cache.get(newChannel.guild.DB.eventChannels.guild);
    if (!logChannel) return;

    let audit;

    const diff = newChannel.permissionOverwrites.difference(oldChannel.permissionOverwrites);
    let overwritesUpdates = [];

    for (const [key, val] of newChannel.permissionOverwrites) {
        const oldOverwrites = oldChannel.permissionOverwrites.get(key);
        if (!oldOverwrites) continue;
        if (oldOverwrites?.allow.bitfield !== val.allow.bitfield ||
            oldOverwrites?.deny.bitfield !== val.deny.bitfield) {
            overwritesUpdates.push({ new: val, old: oldOverwrites });
            console.log; // BREAKPOINT
        }
    };

    const emb = defaultEventLogEmbed(newChannel.guild);
    let fetchAudit, fetchAR;

    if (overwritesUpdates.length) {
        for (const overwrite of overwritesUpdates) {
            const oldAllow = overwrite.old?.allow.serialize(),
                oldDeny = overwrite.old?.deny.serialize(),
                newAllow = overwrite.new.allow.serialize(),
                newDeny = overwrite.new.deny.serialize(),
                allowDiff = changed(oldAllow, newAllow),
                denyDiff = changed(oldDeny, newDeny);
            let allowBefore = [], allowAfter = [], denyBefore = [], denyAfter = [];
            for (const u in allowDiff.oldObj) {
                if (!allowDiff.oldObj[u]) continue;
                allowBefore.push(u);
            };
            for (const u in allowDiff.newObj) {
                if (!allowDiff.newObj[u]) continue;
                allowAfter.push(u);
            };
            for (const u in denyDiff.oldObj) {
                if (!denyDiff.oldObj[u]) continue;
                denyBefore.push(u);
            };
            for (const u in denyDiff.newObj) {
                if (!denyDiff.newObj[u]) continue;
                denyAfter.push(u);
            };
            emb.addField(`Changed override`, `**For ${overwrite.new.type}** ${overwrite.new.type === "member" ?
                `<@${overwrite.new.id}> (${overwrite.new.id})` : overwrite.new.id === newChannel.guild.id ? "@everyone" : `<@&${overwrite.new.id}> (${overwrite.new.id})`
                }\n` + "**Approved before:**```js\n" +
                (allowBefore.join(", ") || "NONE") + "```**Currently approved:**```js\n" +
                (allowAfter.join(", ") || "NONE") + "```**Denied before:**```js\n" +
                (denyBefore.join(", ") || "NONE") + "```**Currently denied:**```js\n" +
                (denyAfter.join(", ") || "NONE") + "```");
            console.log; // BREAKPOINT
        }
    };

    if (diff.size) {
        for (const [key, val] of diff) {
            const removed = oldChannel.permissionOverwrites.get(key);
            const added = newChannel.permissionOverwrites.get(key);
            if (!newChannel.guild.roles.cache.get((removed || added).id)) continue;
            if (removed) {
                if (blockChannelUpdate && removed.id === newChannel.guild.DB.settings.mute.role) return;
                if (!fetchAR) fetchAR = "R";
                const allow = removed.allow.serialize(), deny = removed.deny.serialize();
                let all = [], den = [];
                for (const K in allow) {
                    if (!allow[K]) continue;
                    all.push(K);
                };
                for (const K in deny) {
                    if (!deny[K]) continue;
                    den.push(K);
                };
                emb.addField(`Removed override`, `**For ${removed.type}** ${removed.type === "member" ?
                    `<@${removed.id}> (${removed.id})` : removed.id === newChannel.guild.id ? "@everyone" : `<@&${removed.id}> (${removed.id})`}\n` +
                    "**Approved:**```js\n" + (all.join(", ") || "NONE") + "```" +
                    "**Denied:**```js\n" + (den.join(", ") || "NONE") + "```");
                console.log; // BREAKPOINT
            } else if (added) {
                if (blockChannelUpdate && added.id === newChannel.guild.DB.settings.mute.role) return;
                if (!fetchAR) fetchAR = "A";
                const allow = added.allow.serialize(), deny = added.deny.serialize();
                let all = [], den = [];
                for (const K in allow) {
                    if (!allow[K]) continue;
                    all.push(K);
                };
                for (const K in deny) {
                    if (!deny[K]) continue;
                    den.push(K);
                };
                emb.addField(`Added override`, `**For ${added.type}** ${added.type === "member" ?
                    `<@${added.id}> (${added.id})` : added.id === newChannel.guild.id ? "@everyone" : `<@&${added.id}> (${added.id})`}\n` +
                    "**Approved:**```js\n" + (all.join(", ") || "NONE") + "```" +
                    "**Denied:**```js\n" + (den.join(", ") || "NONE") + "```");
                console.log; // BREAKPOINT
            }
        }
    };

    if (newChannel.guild.me.hasPermission("VIEW_AUDIT_LOG")) {
        if (!audit && overwritesUpdates.length) {
            audit = await getAudit(newChannel.guild, dateNow, newChannel.id, { type: "CHANNEL_OVERWRITE_UPDATE" });
        };
        if (!audit && fetchAudit) {
            audit = await getAudit(newChannel.guild, dateNow, newChannel.id, { type: "CHANNEL_UPDATE" });
        };
        if (!audit && fetchAR) {
            /**
             * @type {import("discord.js").GuildAuditLogsFetchOptions}
             */
            let opt = {};
            switch (fetchAR) {
                case "A": opt.type = "CHANNEL_OVERWRITE_CREATE"; break;
                case "R": opt.type = "CHANNEL_OVERWRITE_DELETE"; break;
            };
            audit = await getAudit(newChannel.guild, dateNow, newChannel.id, opt);
        };
    };

    emb.setTitle("Channel `" + newChannel.name + "` updated" + (audit?.executor ? ` by ${audit.executor.bot ? "`[BOT]` " : ""}\`${audit.executor.tag}\`` : ""))
        .setColor(getColor("cyan"))
        .addField("Channel", `<#${newChannel.id}>\n(${newChannel.id})`, true);
    if (emb.fields.length < 2) return;
    if (audit?.executor) {
        emb.setAuthor(emb.author.name, audit.executor.displayAvatarURL({ size: 128, format: "png", dynamic: true }))
            .addField("Administrator", `<@${audit.executor.id}>\n(${audit.executor.id})`, true);
        if (audit.executor.bot) emb.addField("​", audit.reason || "No reason provided");
    }
    console.log; // BREAKPOINT
    return trySend(newChannel.client, logChannel, emb);
};

/**
 * @param {Guild} guild Get audit from
 * @param {Date} dateNow 
 * @param {string} id Target ID
 * @param {import("discord.js").GuildAuditLogsFetchOptions} option 
 * @returns {Promise<GuildAuditLogsEntry>}
 */
async function getAudit(guild, dateNow, id, option, filter = (value, key, collection) =>
    value.target.id === id && (dateNow.valueOf() - value.createdTimestamp) < 60000) {
    const col = await guild.fetchAuditLogs(option);
    const fil = col.entries.filter(filter);
    return fil.first();
};

function blockChannelUpdateEvents() {
    blockChannelUpdate = true;
    console.log("CHANNEL UPDATE EVENTS BLOCKED. STATE:", blockChannelUpdate);
};

function unblockChannelUpdateEvents() {
    blockChannelUpdate = false;
    console.log("CHANNEL UPDATE EVENTS UNBLOCKED. STATE:", blockChannelUpdate);
};

module.exports = { run, blockChannelUpdateEvents, unblockChannelUpdateEvents }