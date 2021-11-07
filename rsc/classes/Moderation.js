'use strict';

const ShaClient = require("./ShaClient");
const { GuildResolvable, GuildMemberResolvable, GuildMember, Guild, User } = require("discord.js");
const { loadDb } = require("../database");
const { logDev } = require("../debug");

/**
 * @typedef {object} ModerationOpt
 * @property {GuildResolvable} guild
 * @property {User[] | User | GuildMember[] | GuildMember} targets
 * @property {GuildMemberResolvable} moderator
 */

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
        return this.infractions.filter(r => r.offender.some(r => r.id === id));
    }

    /**
     * 
     * @param {number} id 
     * @returns 
     */
    async getInfraction(id) {
        await this.loadInfractions();
        return this.infractions.find(r => r.case === id);
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
     * @returns 
     */
    removeTarget(id) {
        if (id.id) id = id.id;
        const users = this.target.users.splice(this.target.users.findIndex(r => r.id === id), 1);
        const members = this.target.members.splice(this.target.members.findIndex(r => r.id === id), 1);
        logDev(users, members);
        return { users, members };
    }

    /**
     * 
     * @param {import("discord.js").BanOptions} opt 
     */
    ban(opt) {
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

    kick(reason) {
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
}

module.exports = { BaseModeration, Moderation }