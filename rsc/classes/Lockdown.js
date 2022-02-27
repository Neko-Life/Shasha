"use strict";

const { SCHEDULE_MESSAGER_PATH } = require("../constants");
const { loadDb } = require("../database");
const { logDev } = require("../debug");
const { emitShaError } = require("../functions");

/**
 * @typedef {object} LockdownIgnore
 * @property {import("discord.js").RoleResolvable[]} roles
 * @property {import("../constants").PERMISSION_NAMES} permissions
 */

/**
 * @typedef {object} LockdownOpt
 * @property {LockdownIgnore} [ignores={}]
 * @property {boolean} [noTextOnly=false]
 * @property {Date} [end=null]
 * @property {string} [reason="No reason provided"]
 * @property {boolean} [force=false]
 */

class Lockdown {
    /**
     * 
     * @param {import("discord.js").GuildTextChannelResolvable[]} targets 
     * @param {import("../typins").ShaGuildMember} moderator
     * @param {LockdownOpt} param2
     */
    constructor(targets, moderator, { force = false, ignores = {}, noTextOnly = false, end = null, reason = "No reason provided" } = {}) {
        /** @type {import("../typins").ShaGuildChannel[]} */
        this.targets = targets.map(r => moderator.guild.channels.resolve(r)).filter(r => r && !r.executingLockdown);
        if (!this.targets?.length) throw new RangeError("No target channel found or they're already executing");
        if (!noTextOnly)
            if (this.targets.some(r => !r.isText?.()))
                throw new TypeError("Some channel aren't text channel");
        for (const C of this.targets) C.executingLockdown = true;
        this.client = moderator.client;
        this.guild = moderator.guild;
        this.ignores = {
            roles: ignores.roles?.map(r => moderator.guild.roles.resolve(r)),
            permissions: ignores.permissions,
        };
        this.end = end;
        this.noTextOnly = noTextOnly;
        this.reason = reason;
        this.force = force;
    }

    async lock() {
        const executed = [];
        const already = [];
        for (const C of this.targets) {
            loadDb(C, `channel/${C.id}`);
            if (await C.db.getOne("lockdown", "Object[]")) {
                delete C.executingLockdown;
                already.push(C);
                continue;
            }
            const targetOverwrites = C.permissionOverwrites
                .cache.filter(
                    r => {
                        const defaultCriteria = r.type === "role"
                            && !this.ignores.roles?.some(g => g.id === r.id)
                            && !this.ignores.permissions?.some(i => C.permissionsFor(r.id).has(i));
                        if (this.force)
                            return defaultCriteria;
                        else return defaultCriteria
                            && !C.permissionsFor(r.id).has("ADMINISTRATOR")
                            && !r.allow?.has("MANAGE_MESSAGES")
                            && !r.deny?.has("SEND_MESSAGES")
                            && !r.deny?.has("VIEW_CHANNEL");
                    }
                );
            const success = [];
            const failed = [];
            const oldP = {};
            for (const [k, v] of targetOverwrites) {
                const alS = v.allow?.has("SEND_MESSAGES");
                const oP = [!alS, alS];
                oldP[v.id] = oP.indexOf(true);
                const edited = await v.edit({
                    SEND_MESSAGES: false
                }, this.reason).catch(e => { logDev(e); emitShaError(e) });
                if (edited)
                    success.push(edited);
                else failed.push(v);
            }
            delete C.executingLockdown;
            if (!success.length) continue;
            const dbV = success.map(r => {
                return {
                    id: r.id,
                    oldPerm: oldP[r.id],
                }
            });
            await C.db.set("lockdown", "Object[]", { value: dbV });
            executed.push({
                channel: C,
                success,
                failed,
                targetOverwrites,
            });
            C.setName("🔒" + C.name).catch(e => { logDev(e); emitShaError(e) });
            if (this.end) {
                const data = {
                    action: "unlock",
                    guild: this.guild.id,
                    target: C.id,
                    targetType: "channel"
                }
                await this.client.scheduler.add({
                    name: "unlock/" + this.guild.id + "/" + C.id,
                    date: this.end,
                    path: SCHEDULE_MESSAGER_PATH,
                    type: "guild",
                    worker: {
                        workerData: data
                    }
                });
            }
        }
        return { executed, already };
    }

    async unlock() {
        const executed = [];
        const already = [];

        for (const C of this.targets) {
            loadDb(C, `channel/${C.id}`);
            const getDb = await C.db.getOne("lockdown", "Object[]");
            const settings = getDb?.value;
            if (!settings?.length) {
                delete C.executingLockdown;
                already.push(C);
                continue;
            }
            const success = [];
            const failed = [];
            for (const V of settings) {
                const edited = await C.permissionOverwrites.edit(V.id, {
                    SEND_MESSAGES: V.oldPerm ? true : null
                }, { reason: this.reason }).catch(e => { logDev(e); emitShaError(e) });
                if (edited)
                    success.push(edited);
                else failed.push(V);
            }
            delete C.executingLockdown;
            if (!success.length) continue;
            await C.db.delete("lockdown", "Object[]");
            if (C.name.startsWith("🔒"))
                C.setName(C.name.slice(2)).catch(e => { logDev(e); emitShaError(e) });
            executed.push({
                channel: C,
                success,
                failed,
                settings,
            });
            try { await this.client.scheduler.remove("unlock/" + this.guild.id + "/" + C.id); }
            catch (e) { logDev(e); };
        }

        return { executed, already };
    }
}

module.exports = { Lockdown }
