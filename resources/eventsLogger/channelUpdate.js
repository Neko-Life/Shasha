'use strict';

const { GuildChannel, Guild, GuildAuditLogsEntry } = require("discord.js");
const { Interval } = require("luxon");
const { intervalToDuration } = require("../../cmds/moderation/src/duration");
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

    const diff = newChannel.permissionOverwrites.difference(oldChannel.permissionOverwrites);
    let overwriteRoles = [], overwriteMembers = [], audit;

    for (const [key, val] of newChannel.permissionOverwrites) {
        const oldOverwrites = oldChannel.permissionOverwrites.get(key);
        if (!oldOverwrites) continue;
        if (oldOverwrites?.allow.bitfield !== val.allow.bitfield ||
            oldOverwrites?.deny.bitfield !== val.deny.bitfield) {
            if (val.type === "role")
                overwriteRoles.push({ new: val, old: oldOverwrites });
            else overwriteMembers.push({ new: val, old: oldOverwrites });
            console.log; // BREAKPOINT
        }
    };

    const emb = defaultEventLogEmbed(newChannel.guild);
    let fetchAudit, fetchAR;

    console.log; // BREAKPOINT
    if (oldChannel.name !== newChannel.name) {
        if (!fetchAudit) fetchAudit = true;
        emb.addField("Name", `Changed from \`${oldChannel.name || "Unknown"}\` to \`${newChannel.name}\``);
    };
    if (newChannel.type !== "category") {
        if (oldChannel.parent !== newChannel.parent) {
            if (!fetchAudit) fetchAudit = true;
            emb.addField("Parent Category", `Moved from \`${oldChannel.parent?.name ||
                "[NONE]"}\` to \`${newChannel.parent?.name || "[NONE]"}\``);
        };
    };
    if (newChannel.type !== "voice" && newChannel.type !== "category") {
        if (oldChannel.topic !== newChannel.topic) {
            if (!fetchAudit) fetchAudit = true;
            emb.addField("Old Topic", oldChannel.topic || "`[NONE]`");
            emb.addField("New Topic", newChannel.topic || "`[NONE]`");
        };
        if (oldChannel.nsfw !== newChannel.nsfw) {
            if (!fetchAudit) fetchAudit = true;
            emb.addField("NSFW", newChannel.nsfw ? "`Enabled`" : "`Disabled`");
        };
        if (oldChannel.type !== newChannel.type) {
            if (!fetchAudit) fetchAudit = true;
            emb.addField("Announcement", newChannel.type === "news" ?
                "`Enabled`" : "`Disabled`");
        };
        if (newChannel.type === "text") {
            if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
                if (!fetchAudit) fetchAudit = true;
                emb.addField("Slowmode",
                    `Changed from \`${oldChannel.rateLimitPerUser ?
                        intervalToDuration(
                            Interval.after(dateNow, oldChannel.rateLimitPerUser * 1000)
                        ).strings.join(" ") : "[NONE]"
                    }\` to \`${newChannel.rateLimitPerUser ?
                        intervalToDuration(
                            Interval.after(dateNow, newChannel.rateLimitPerUser * 1000)
                        ).strings.join(" ") : "`[NONE]`"
                    }\``)
            };
        }
    } else if (newChannel.type === "voice") {
        if (oldChannel.userLimit !== newChannel.userLimit) {
            if (!fetchAudit) fetchAudit = true;
            emb.addField("User Limit", `Changed from \`${oldChannel.userLimit || "Unlimited"
                }\` to \`${newChannel.userLimit || "Unlimited"}\``);
        };
        if (oldChannel.bitrate !== newChannel.bitrate) {
            if (!fetchAudit) fetchAudit = true;
            emb.addField("Bitrate", `Changed from \`${oldChannel.bitrate / 1000
                || "Unknown"} Kbps\` to \`${newChannel.bitrate / 1000} Kbps\``);
        };
    };

    if (overwriteRoles.length || overwriteMembers.length) {
        let overwrite;
        if (overwriteRoles.length) {
            if (overwriteRoles.length > 1) {
                overwriteRoles = overwriteRoles.sort((a, b) =>
                    newChannel.guild.roles.cache.get(a.new.id).createdTimestamp -
                    newChannel.guild.roles.cache.get(b.new.id).createdTimestamp);
                if (overwriteRoles[0].new.id === newChannel.guild.id) overwriteRoles = overwriteRoles.slice(1);
            }
            overwrite = overwriteRoles.shift();
        } else {
            if (overwriteMembers.length > 1)
                overwriteMembers = overwriteMembers.sort((a, b) =>
                    newChannel.guild.member(a.new.id).displayName -
                    newChannel.guild.member(b.new.id).displayName);
            overwrite = overwriteMembers.shift();
        };
        if (overwrite) {
            const oldAllow = overwrite.old?.allow.serialize(),
                oldDeny = overwrite.old?.deny.serialize(),
                newAllow = overwrite.new.allow.serialize(),
                newDeny = overwrite.new.deny.serialize(),
                allowDiff = changed(oldAllow, newAllow),
                denyDiff = changed(oldDeny, newDeny);
            let allowBefore = [], allowAfter = [], denyBefore = [], denyAfter = [], neutral = [];
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
            for (const U in newAllow) {
                if (
                    !newAllow[U] &&
                    oldAllow?.[U] !== newAllow[U] &&
                    !newDeny[U]
                ) neutral.push(U);
                else continue;
            };
            for (const U in newDeny) {
                if (
                    !newDeny[U] &&
                    oldDeny?.[U] !== newDeny[U] &&
                    !newAllow[U]
                ) neutral.push(U);
                else continue;
            }
            emb.addField(`Changed override`,
                `**For ${overwrite.new.type}** ${overwrite.new.type === "member" ?
                    `<@${overwrite.new.id}> (${overwrite.new.id})` :
                    overwrite.new.id === newChannel.guild.id ?
                        "@everyone" : `<@&${overwrite.new.id}> (${overwrite.new.id})`
                }\n` +
                (
                    allowBefore.length ?
                        "**Approved before:**```js\n" +
                        allowBefore.join(", ") +
                        "```" : ""
                ) +
                (
                    denyBefore.length ?
                        "** Denied before:** ```js\n" +
                        denyBefore.join(", ") +
                        "```" : ""
                ) +
                (
                    neutral.length ?
                        "**Defaulted:**```js\n" + neutral.join(", ") +
                        "```" : ""
                ) +
                (
                    allowAfter.length ?
                        "**Approved:**```js\n" +
                        allowAfter.join(", ") +
                        "```" : ""
                ) +
                (
                    denyAfter.length ?
                        "**Denied:**```js\n" +
                        denyAfter.join(", ") +
                        "```" : ""
                )
            );
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
                    `<@${removed.id}> (${removed.id})` :
                    removed.id === newChannel.guild.id ?
                        "@everyone" : `<@&${removed.id}> (${removed.id})`
                    }\n` +
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
                    `<@${added.id}> (${added.id})` :
                    added.id === newChannel.guild.id ?
                        "@everyone" : `<@&${added.id}> (${added.id})`
                    }\n` +
                    "**Approved:**```js\n" + (all.join(", ") || "NONE") + "```" +
                    "**Denied:**```js\n" + (den.join(", ") || "NONE") + "```");
                console.log; // BREAKPOINT
            }
        }
    };

    if (newChannel.guild.me.hasPermission("VIEW_AUDIT_LOG")) {
        if (!audit && overwriteRoles.length) {
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

    emb.setTitle((newChannel.type === "voice" ? "Voice " : "") +
        (newChannel.type === "category" ? "Category" : "Channel") +
        " `" + newChannel.name + "` updated" + (audit?.executor ?
            ` by ${audit.executor.bot ? "`[BOT]` " : ""
            }\`${audit.executor.tag}\`` : ""))
        .setColor(getColor("cyan"))
        .addField((newChannel.type === "voice" ? "Voice " : "") +
            (newChannel.type === "category" ? "Category" : "Channel"),
            `<#${newChannel.id}>\n(${newChannel.id})`, true);
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

module.exports = { run, blockChannelUpdateEvents, unblockChannelUpdateEvents, getAudit }