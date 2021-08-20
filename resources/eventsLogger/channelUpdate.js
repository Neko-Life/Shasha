'use strict';

const { GuildChannel, Guild, GuildAuditLogsEntry, Role } = require("discord.js");
const { Interval } = require("luxon");
const { intervalToDuration } = require("../../cmds/moderation/src/duration");
const { defaultEventLogEmbed, changed, trySend, wait, getAudit } = require("../functions");
const getColor = require("../getColor");
let blockChannelUpdate = false;

/**
 * @param {GuildChannel} oldChannel 
 * @param {GuildChannel} newChannel 
 */
async function run(oldChannel, newChannel) {
    if (!newChannel.guild.DB) await newChannel.guild.dbLoad();
    if (!newChannel.guild.DB.eventChannels?.guild) return;
    const logChannel = newChannel.guild.channels.cache.get(newChannel.guild.DB.eventChannels.channel);
    if (!logChannel) return;

    const dateNow = new Date();
    const diff = newChannel.permissionOverwrites.difference(oldChannel.permissionOverwrites),
        emb = defaultEventLogEmbed(newChannel.guild);

    let audit, fetchAudit, fetchOverwrites,
        permissionsOverwrites = new Map(),
        permissionsAdded = new Map(),
        permissionsRemoved = new Map();

    for (const [key, val] of newChannel.permissionOverwrites) {
        const oldOverwrites = oldChannel.permissionOverwrites.get(key);
        if (!oldOverwrites) continue;
        if (oldOverwrites?.allow.bitfield !== val.allow.bitfield ||
            oldOverwrites?.deny.bitfield !== val.deny.bitfield) {
            permissionsOverwrites.set(key, { old: oldOverwrites, new: val });
            if (!fetchOverwrites) fetchOverwrites = true;
        };
    };

    if (diff.size) {
        for (const [key, val] of diff) {
            const removed = oldChannel.permissionOverwrites.get(key);
            const added = newChannel.permissionOverwrites.get(key);
            if (added) permissionsAdded.set(key, added);
            if (removed) permissionsRemoved.set(key, removed);
        };
    };

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

    if (diff.size && newChannel.guild.me.hasPermission("VIEW_AUDIT_LOG")) {
        let getID, removed, added;

        if (permissionsRemoved.size) {
            audit = await getAudit(newChannel.guild, dateNow, newChannel.id,
                { type: "CHANNEL_OVERWRITE_DELETE" });
            getID = audit.changes[0].old;
            await wait(4000);
        }
        else if (permissionsAdded.size) {
            await wait(1000);
            audit = await getAudit(newChannel.guild, dateNow, newChannel.id,
                { type: "CHANNEL_OVERWRITE_CREATE" });
            getID = audit.changes[0].new;
            added = permissionsAdded.get(getID);
        };

        if ((audit.extra instanceof Role) ? newChannel.guild.roles.cache.get(getID) :
            newChannel.guild.member(getID)) {
            if (audit.action === "CHANNEL_OVERWRITE_DELETE") {
                for (const [key, val] of permissionsRemoved) {
                    removed = oldChannel.permissionOverwrites.get(key);

                    if (blockChannelUpdate &&
                        removed.id === newChannel.guild.DB.settings.mute.role) return;

                    const allow = removed.allow.serialize(),
                        deny = removed.deny.serialize();
                    let all = [], den = [];

                    for (const K in allow) {
                        if (!allow[K]) continue;
                        all.push(K);
                    };
                    for (const K in deny) {
                        if (!deny[K]) continue;
                        den.push(K);
                    };

                    emb.addField(`Removed override`,
                        `**For ${removed.type}** ${removed.type === "member" ?
                            `<@${removed.id}> \`${newChannel.guild.member(removed.id)
                                .user.tag}\` (${removed.id})` :
                            removed.id === newChannel.guild.id ?
                                "@everyone" : `<@&${removed.id}> \`${newChannel.guild.roles.cache
                                    .get(removed.id).name}\` (${removed.id})`
                        }\n` +
                        "**Approved:**```js\n" + (all.join(", ") || "NONE") + "```" +
                        "**Denied:**```js\n" + (den.join(", ") || "NONE") + "```");
                }
            } else if (audit.action === "CHANNEL_OVERWRITE_CREATE") {
                if (blockChannelUpdate &&
                    added.id === newChannel.guild.DB.settings.mute.role) return;

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

                emb.addField(`Added override`,
                    `**For ${added.type}** ${added.type === "member" ?
                        `<@${added.id}> \`${newChannel.guild.member(added.id)
                            .user.tag}\` (${added.id})` :
                        added.id === newChannel.guild.id ?
                            "@everyone" : `<@&${added.id}> \`${newChannel.guild.roles.cache
                                .get(added.id).name}\` (${added.id})`
                    }\n` +
                    "**Approved:**```js\n" + (all.join(", ") || "NONE") + "```" +
                    "**Denied:**```js\n" + (den.join(", ") || "NONE") + "```");
            }
        }
    };

    if (fetchOverwrites && newChannel.guild.me.hasPermission("VIEW_AUDIT_LOG")) {
        await wait(1000);
        audit = await getAudit(newChannel.guild, dateNow, newChannel.id,
            { type: "CHANNEL_OVERWRITE_UPDATE" });
        if (audit.target.id === newChannel.id) {

            if (!oldChannel.permissionsLocked && newChannel.permissionsLocked) {
                permissionsOverwrites.forEach((v, k) => addField(v));
            } else addField(permissionsOverwrites.entries().next().value[1]);

            function addField(val) {
                const oldAllow = val.old.allow.serialize(),
                    oldDeny = val.old.deny.serialize(),
                    newAllow = val.new.allow.serialize(),
                    newDeny = val.new.deny.serialize(),
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
                    `**For ${val.new.type}** ${val.new.type === "member" ?
                        `<@${val.new.id}> \`${newChannel.guild.member(val.new.id)
                            .user.tag}\` (${val.new.id})` :
                        val.new.id === newChannel.guild.id ?
                            "@everyone" : `<@&${val.new.id}> \`${newChannel.guild.roles.cache
                                .get(val.new.id).name}\` (${val.new.id})`
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
            }
        }
    };

    if (fetchAudit && !audit && newChannel.guild.me.hasPermission("VIEW_AUDIT_LOG")) {
        audit = await getAudit(newChannel.guild, dateNow, newChannel.id,
            { type: "CHANNEL_UPDATE" });
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
    };

    return trySend(newChannel.client, logChannel, emb);
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