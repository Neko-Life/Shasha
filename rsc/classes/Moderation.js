'use strict';

const ShaClient = require("./ShaClient");
const { GuildResolvable, GuildMemberResolvable, GuildMember, Guild, User, MessageEmbed } = require("discord.js");
const { loadDb } = require("../database");
const { logDev } = require("../debug");
const { getColor, unixToSeconds } = require("../functions");
const { createInterval, intervalToStrings } = require("../util/Duration");
const { SCHEDULE_MESSAGER_PATH } = require("../constants");
const ENUM_ACTIONS = {
    ban: 1,
    mute: 2,
    kick: 3,
    strike: 4
};

/**
 * @typedef {object} ModerationOpt
 * @property {GuildResolvable} guild
 * @property {User[] | User | GuildMember[] | GuildMember} targets
 * @property {GuildMemberResolvable} moderator
 * 
 * @typedef {object} InfractionConstructor
 * @property {string[]|User[]} offender
 * @property {number} cases
 * @property {keyof ENUM_ACTIONS} action
 * @property {boolean} timed
 * @property {Date|string} invoked
 * @property {Date|string} end
 * @property {string} reason
 * @property {User|string} moderator
 *
 * @typedef {object} MuteOpts
 * @property {Date} invoked
 * @property {Date} end
 * @property {string} [reason="No reason provided"]
 * @property {string} muteRole
 * @property {boolean} [notify=true]
 * 
 * @typedef {object} UnmuteOpts
 * @property {Date} invoked
 * @property {string} [reason="No reason provided"]
 * @property {boolean} [notify=true]
 */

class Infraction {
    /**
     * @param {ShaClient} client
     * @param {InfractionConstructor} param1 
     */
    constructor(client, {
        offender,
        cases,
        action,
        invoked,
        end,
        reason = "No reason provided",
        moderator
    } = {}) {
        this.offender = [];
        for (const k of offender) {
            const user = client.users.resolve(k);
            this.offender.push(user || k);
        }
        if (typeof cases !== "number") throw new TypeError("cases isn't number " + typeof cases);
        this.cases = cases;
        if (!ACTIONS[action]) throw new TypeError("Unknown action");
        this.action = action;
        if (end)
            this.end = (end instanceof Date) ? end : new Date(end);
        else this.end = null;
        this.timed = this.end ? true : false;
        this.invoked = (invoked instanceof Date) ? invoked : new Date(invoked);
        this.reason = reason;
        this.moderator = client.users.resolve(moderator) || moderator;
    }

    toJSON() {
        return {
            offender: this.offender.map(r => r.id || r),
            cases: this.cases,
            action: this.action,
            invoked: this.invoked.toISOString(),
            end: this.end ? this.end.toISOString() : null,
            reason: this.reason,
            moderator: this.moderator.id || this.moderator
        };
    }
}

class BaseModeration {
    /**
     * @param {ShaClient} client 
     * @param {GuildResolvable} guild 
     */
    constructor(client, guild) {
        if (!client) throw new TypeError("client undefined");
        guild = client.guilds.resolve(guild);
        if (!guild) throw new TypeError("guild undefined");
        /**
         * @type {ShaClient}
         */
        this.client = client;
        /**
         * @type {Guild}
         */
        this.guild = guild;
        /**
         * @type {GuildMember}
         */
        this.me = guild.me;
        /**
         * @type {object[]}
         */
        this.infractions = null;
    }

    static loadModeration(guild) {
        if (guild.moderation instanceof BaseModeration) return guild;
        guild.moderation = new BaseModeration(guild.client, guild);
        return guild;
    }

    async loadInfractions() {
        if (Array.isArray(this.infractions)) return this.infractions;
        const gd = loadDb(this.guild, "guild/" + this.guild.id);
        const get = await gd.db.getOne("infractions", "Object[]");
        return this.infractions = get?.value || [];
    }

    /**
     * 
     * @param {User | GuildMember | string} offender 
     * @returns
     */
    async searchInfractions(offender) {
        await this.loadInfractions();
        const id = offender.id || offender;
        return this.infractions.filter(r => r.offender.some(r => (r.id || r) === id));
    }

    /**
     * 
     * @param {number} id 
     * @returns 
     */
    async getInfraction(id) {
        await this.loadInfractions();
        return this.infractions.find(r => r.cases === id);
    }

    async addInfractions(infractions) {
        if (!Array.isArray(infractions))
            infractions = [infractions];
        await this.loadInfractions();
        const result = this.infractions.push(...infractions);
        const gd = loadDb(this.guild, "guild/" + this.guild.id);
        const db = await gd.db.set("infractions", "Object[]", { value: this.infractions });
        return { result, db };
    }

    /**
     * 
     * @param {GuildMember | User} user 
     * @param {MuteOpts} opt
     */
    async _execMute(user, opt) {
        const ud = loadDb(user, "member/" + this.guild.id + "/" + user.id);
        if (!opt.reason) opt.reason = "No reason provided";
        if (user instanceof GuildMember) {
            const takeRoles = user.roles.cache.filter(r =>
                !r.managed && r.id !== r.guild.id && r.id !== opt.muteRole);
            if (takeRoles.size)
                await user.roles.remove(takeRoles, opt.reason);
            if (!user.roles.resolve(opt.muteRole))
                await user.roles.add(opt.muteRole, opt.reason);
            const get = await ud.db.getOne("muted", "Object");
            const oldMute = get?.value || {};
            if (oldMute.state && oldMute.takenRoles)
                opt.takenRoles = oldMute.takenRoles;
            else opt.takenRoles = takeRoles.map(r => r.id);
        }
        if (typeof opt.notify !== "boolean") opt.notify = true;
        if (opt.notify) {
            const emb = new MessageEmbed()
                .setAuthor(this.guild.name, this.guild.iconURL({ size: 128, format: "png", dynamic: true }))
                .setColor(getColor((user.user || user).accentColor, true) || getColor(user.displayColor, true))
                .setDescription(opt.reason)
                .setTitle("Mute")
                .addField("At", "<t:" + unixToSeconds(opt.invoked) + ":F>", true);
            if (opt.end) {
                const interval = createInterval(opt.invoked, opt.end);
                const duration = intervalToStrings(interval);
                emb.addField("Until", "<t:" + unixToSeconds(opt.end) + ":F>", true)
                    .addField("For", "`" + duration.strings.join(" ") + "`");
            } else emb.addField("Until", "`Never`", true)
                .addField("For", "`Ever`");
            try {
                if (await user.send({ embeds: [emb] }))
                    opt.notified = true;
            } catch (e) { logDev(e); opt.notified = false; };
        }
        const val = { ...opt, state: true };
        ud.db.set("muted", "Object", { value: val });
        if (opt.end) {
            const data = {
                action: "unmute",
                guild: this.guild.id,
                target: user.id,
                targetType: "user"
            }
            await this.client.scheduler.add({
                name: "unmute/" + this.guild.id + "/" + user.id,
                date: opt.end,
                path: SCHEDULE_MESSAGER_PATH,
                worker: {
                    workerData: data
                }
            });
        }
        return { user, val };
    }

    /**
     *
     * @param {GuildMember | User} user
     * @param {UnmuteOpts} opt
     */
    async _execUnmute(user, opt) {
        const ud = loadDb(user, "member/" + this.guild.id + "/" + user.id);
        const get = await ud.db.getOne("muted", "Object");
        const options = get?.value;
        if (!options?.state) throw new Error("This user isn't muted");
        if (!opt.reason) opt.reason = "No reason provided";
        if (user instanceof GuildMember) {
            if (options.takenRoles?.length)
                await user.roles.add(options.takenRoles, opt.reason);
            if (user.roles.resolve(options.muteRole))
                await user.roles.remove(options.muteRole, opt.reason);
        }
        if (typeof opt.notify !== "boolean") opt.notify = true;
        if (opt.notify) {
            const emb = new MessageEmbed()
                .setAuthor(this.guild.name, this.guild.iconURL({ size: 128, format: "png", dynamic: true }))
                .setDescription(opt.reason)
                .setColor(getColor((user.user || user).accentColor, true) || getColor(user.displayColor, true))
                .setTitle("Unmute");
            try {
                if (await user.send({ embeds: [emb] }))
                    opt.notified = true;
            } catch (e) { logDev(e); opt.notified = false; };
        }
        const val = { ...opt, state: false };
        ud.db.set("muted", "Object", { value: val });
        if (this.client.scheduler.jobs.find(r => r.name === ("unmute/" + this.guild.id + "/" + user.id)))
            try { await this.client.scheduler.remove("unmute/" + this.guild.id + "/" + user.id); }
            catch (e) { logDev(e) };
        return { user, val };
    }
}

class Moderation extends BaseModeration {
    /**
     * @param {ShaClient} client
     * @param {ModerationOpt} param0
     */
    constructor(client, { guild, targets, moderator }) {
        super(client, guild);
        if (!Array.isArray(targets)) targets = [targets];
        if (targets.some(r => !(r instanceof User) && !(r instanceof GuildMember)))
            throw new TypeError("some target isn't User or GuildMember");
        if (!(moderator instanceof GuildMember))
            throw new TypeError("moderator isn't GuildMember");

        const targetUs = [];
        for (const r of targets) {
            if (targetUs.some(a => a.id === r.id)) continue;
            if (r instanceof User) targetUs.push(r);
            else targetUs.push(r.user);
        }
        const targetMs = [];
        for (const r of targets) {
            if (targetMs.some(a => a.id === r.id)) continue;
            const get = this.guild.members.resolve(r);
            if (!(get instanceof GuildMember)) continue;
            targetMs.push(get);
        }
        /**
         * @type {{users: User[], members: GuildMember[]}}
         */
        this.target = {
            users: targetUs,
            members: targetMs
        };
        /**
         * @type {GuildMember}
         */
        this.moderator = moderator;

        /**
         * @type {number}
         */
        this.moderatorPosition = moderator.roles.highest.position;
        /**
         * @type {boolean}
         */
        this.moderatorBanPerm = moderator.permissions.has("BAN_MEMBERS");
        /**
         * @type {boolean}
         */
        this.moderatorKickPerm = moderator.permissions.has("KICK_MEMBERS");
        /**
         * @type {boolean}
         */
        this.moderatorManageRolesPerm = moderator.permissions.has("MANAGE_ROLES");
        /**
         * @type {number}
         */
        this.clientPosition = this.me.roles.highest.position;
        /**
         * @type {boolean}
         */
        this.clientBanPerm = this.me.permissions.has("BAN_MEMBERS");
        /**
         * @type {boolean}
         */
        this.clientKickPerm = this.me.permissions.has("KICK_MEMBERS");
        /**
         * @type {boolean}
         */
        this.clientManageRolesPerm = this.me.permissions.has("MANAGE_ROLES");

        /**
         * @type {GuildMember[]}
         */
        this.higherThanModerator = [];
        /**
         * @type {GuildMember[]}
         */
        this.higherThanClient = [];

        for (const U of targetMs) {
            const pos = U.roles.highest.position;
            if (pos >= this.clientPosition)
                this.higherThanClient.push(U);
            if (pos >= this.moderatorPosition)
                this.higherThanModerator.push(U);
        }
    }

    /**
     * 
     * @param {GuildMember | User | GuildMember[] | User[]} targets
     * @returns 
     */
    addTargets(targets) {
        if (!Array.isArray(targets)) targets = [targets];
        if (!targets.length) return;
        if (targets.some(r => !(r instanceof User) && !(r instanceof GuildMember)))
            throw new TypeError("some targets isn't User or GuildMember");
        const users = this.addUserTargets(targets.filter(r => r instanceof User));
        const toMembers = [];
        for (const U of targets) {
            const resolve = this.guild.members.resolve(U);
            if (!resolve) continue;
            toMembers.push(resolve);
        }
        const members = this.addMemberTargets(toMembers);
        logDev(users, members);
        return { users, members };
    }

    addUserTargets(users) {
        if (!Array.isArray(users)) users = [users];
        if (!users.length) return;
        if (users.some(r => !(r instanceof User))) throw new TypeError("some user isn't User");
        const push = users.filter(r => !this.target.users.some(a => a.id === r.id));
        if (!push.length) return;
        return this.target.users.push(...push);
    }

    addMemberTargets(members) {
        if (!Array.isArray(members)) members = [members];
        if (!members.length) return;
        if (members.some(r => !(r instanceof GuildMember)))
            throw new TypeError("some member isn't GuildMember");
        const push = members.filter(r => !this.target.members.some(a => a.id === r.id));
        if (!push.length) return;
        for (const member of push) {
            const pos = member.roles.highest.position;
            if (pos >= this.clientPosition)
                this.higherThanClient.push(member);
            if (pos >= this.moderatorPosition)
                this.higherThanModerator.push(member);
        }
        return this.target.members.push(...push);
    }

    /**
     * 
     * @param {GuildMember | User | string} id 
     * @returns Removed targets
     */
    removeTarget(id) {
        if (id.id) id = id.id;
        let users;
        const uI = this.target.users.findIndex(r => r.id === id);
        if (uI >= 0)
            users = this.target.users.splice(uI, 1);
        let members;
        const uM = this.target.members.findIndex(r => r.id === id);
        if (uM >= 0)
            members = this.target.members.splice(uM, 1);
        logDev(users, members);
        return { users, members };
    }

    /**
     * 
     * @param {import("discord.js").BanOptions} opt 
     */
    async ban(opt) {
        if (!this.moderatorBanPerm)
            throw new Error("Moderator lack BAN_MEMBERS permission");
        if (!this.clientBanPerm)
            throw new Error("Client lack BAN_MEMBERS permission");
        const banned = [];
        const higherThanModerator = [];
        const higherThanClient = [];
        for (const a of this.target.users) {
            if (this.higherThanClient.some(r => r.id === a.id)) {
                higherThanClient.push(a);
                continue;
            }
            if (this.higherThanModerator.some(r => r.id === a.id)) {
                higherThanModerator.push(a);
                continue;
            }
            banned.push(await this.guild.bans.create(a, opt));
        }
        return { banned, higherThanModerator, higherThanClient };
    }

    async kick(reason) {
        if (!this.moderatorKickPerm)
            throw new Error("Moderator lack KICK_MEMBERS permission");
        if (!this.clientKickPerm)
            throw new Error("Client lack KICK_MEMBERS permission");
        const kicked = [];
        const higherThanModerator = [];
        const higherThanClient = [];
        for (const a of this.target.members) {
            if (this.higherThanClient.some(r => r.id === a.id)) {
                higherThanClient.push(a);
                continue;
            }
            if (this.higherThanModerator.some(r => r.id === a.id)) {
                higherThanModerator.push(a);
                continue;
            }
            kicked.push(await a.kick(reason));
        }
        return { kicked, higherThanClient, higherThanModerator };
    }

    /**
     * 
     * @param {MuteOpts} opt 
     */
    async mute(opt) {
        if (!this.moderatorManageRolesPerm)
            throw new Error("Moderator lack MANAGE_ROLES permission");
        if (!this.clientManageRolesPerm)
            throw new Error("Client lack MANAGE_ROLES permission");
        if (!opt.muteRole) throw new Error("Mute role hasn't set");
        const muteRole = this.guild.roles.cache.get(opt.muteRole);
        if (!muteRole) throw new RangeError("Mute role missing");
        if (muteRole.position >= this.clientPosition)
            throw new RangeError("Mute role is higher than client");
        if (!opt.invoked) throw new RangeError("invoked hasn't set");
        opt.moderator = this.moderator.id;
        const muted = [];
        const higherThanClient = [];
        const higherThanModerator = [];
        for (const a of this.target.users) {
            if (this.higherThanClient.some(r => r.id === a.id)) {
                higherThanClient.push(a);
                continue;
            }
            if (this.higherThanModerator.some(r => r.id === a.id)) {
                higherThanModerator.push(a);
                continue;
            }
            const m = this.target.members.find(r => r.id === a.id);
            muted.push(await this._execMute(m || a, opt));
        }
        return { muted, higherThanClient, higherThanModerator };
    }

    /**
     * @param {UnmuteOpts} opt 
     */
    async unmute(opt) {
        if (!this.moderatorManageRolesPerm)
            throw new Error("Moderator lack MANAGE_ROLES permission");
        if (!this.clientManageRolesPerm)
            throw new Error("Client lack MANAGE_ROLES permission");
        opt.moderator = this.moderator.id;
        const unmuted = [];
        const higherThanClient = [];
        const higherThanModerator = [];
        for (const a of this.target.users) {
            if (this.higherThanClient.some(r => r.id === a.id)) {
                higherThanClient.push(a);
                continue;
            }
            if (this.higherThanModerator.some(r => r.id === a.id)) {
                higherThanModerator.push(a);
                continue;
            }
            const m = this.target.members.find(r => r.id === a.id);
            unmuted.push(await this._execUnmute(m || a, opt))
        }
        return { unmuted, higherThanClient, higherThanModerator };
    }
}

module.exports = { BaseModeration, Moderation }