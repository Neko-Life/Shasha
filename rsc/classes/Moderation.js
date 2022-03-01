"use strict";

const ShaClient = require("./ShaClient");
const { GuildResolvable, GuildMemberResolvable, GuildMember, Guild, User, MessageEmbed, Channel, VoiceBasedChannel, StageChannel, VoiceChannel } = require("discord.js");
const { loadDb } = require("../database");
const { logDev } = require("../debug");
const { getColor, unixToSeconds, isAdmin } = require("../functions");
const { createInterval, intervalToStrings, parseDuration } = require("../util/Duration");
const { SCHEDULE_MESSAGER_PATH } = require("../constants");
const { ShaBaseDb } = require("./Database");
const { database } = require("../mongo");
const ENUM_ACTIONS = {
    ban: 1,
    mute: 2,
    kick: 3,
    strike: 4,
    timeout: 5,
};

/**
 * @typedef {object} ModerationOpt
 * @property {GuildResolvable} guild
 * @property {User[] | User | GuildMember[] | GuildMember} targets
 * @property {GuildMemberResolvable} moderator
 * @property {Channel} channel
 * @property {VoiceBasedChannel} [VCTarget=null]
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
 * @typedef {DefaultExecModOpts & MuteExtendOpts} MuteOpts
 * 
 * @typedef {object} MuteExtendOpts
 * @property {string} muteRole
 *
 * @typedef {object} DefaultExecModOpts
 * @property {Date} invoked
 * @property {Date} [end=null]
 * @property {string} [reason="No reason provided"]
 * @property {boolean} [notify=true]
 * 
 * @typedef {object} ExtendExecVCOpts
 * @property {import("../typins").ShaGuildMember} moderator
 * @property {boolean} force
 *
 * @typedef {import("discord.js").BanOptions & DefaultExecModOpts} BanOpts
 */

class Infraction {
    /**
     * @param {Guild} guild
     * @param {InfractionConstructor} param1 
     */
    constructor(guild, {
        offender,
        cases,
        action,
        invoked,
        end,
        reason = "No reason provided",
        moderator
    } = {}) {
        /**
         * @type {ShaClient}
         */
        this.client = guild.client;
        /**
         * @type {Guild}
         */
        this.guild = guild;

        /**
         * @type {GuildMember[] | User[] | string[]}
         */
        this.offender = [];
        for (const k of offender) {
            const member = guild.members.resolve(k);
            const user = client.users.resolve(k);
            this.offender.push(member || user || k);
        }
        if (typeof cases !== "number") throw new TypeError("cases isn't number " + typeof cases);
        /**
         * @type {number} - Case number
         */
        this.cases = cases;
        if (!ENUM_ACTIONS[action]) throw new TypeError("Unknown action " + action);
        /**
         * @type {keyof ENUM_ACTIONS} - Action taken
         */
        this.action = action;
        if (end)
            /**
             * @type {Date} - When this punishment will expire
             */
            this.end = (end instanceof Date) ? end : new Date(end);
        else this.end = null;
        /**
         * @type {boolean} - Wether this punishment is timed
         */
        this.timed = this.end ? true : false;
        /**
         * @type {Date} - When this punishment invoked
         */
        this.invoked = (invoked instanceof Date) ? invoked : new Date(invoked);
        /**
         * @type {string} - Reason
         */
        this.reason = reason;
        /**
         * @type {GuildMember | User | string} - Moderator who invoked this infraction
         */
        this.moderator = guild.members.resolve(moderator) || client.users.resolve(moderator) || moderator;
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
     * @param {import("discord.js").TextBasedChannels | VoiceChannel} channel
     */
    constructor(client, guild, channel) {
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
         * @type {import("discord.js").TextBasedChannels | VoiceChannel}
         */
        this.channel = channel;
        /**
         * @type {object[]}
         */
        this.infractions = null;
        /**
         * @type {MessageEmbed}
         */
        this.defaultEmbed = new MessageEmbed().setAuthor({ name: guild.name, iconURL: guild.iconURL({ size: 128, format: "png", dynamic: true }) });
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
     * @param {GuildMember | User} user 
     * @param {BanOpts} opt
     */
    async _execBan(user, opt) {
        if (!opt.reason) opt.reason = "No reason provided";
        if (typeof opt.notify !== "boolean") opt.notify = true;
        if (opt.notify) {
            const emb = new MessageEmbed(this.defaultEmbed)
                .setColor(getColor((user.user || user).accentColor, true, user.displayColor))
                .setDescription(opt.reason)
                .setTitle("Ban")
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

        await this.guild.bans.create(user, { days: opt.days ?? 0, reason: opt.reason });

        if (opt.end) {
            const data = {
                action: "unban",
                guild: this.guild.id,
                target: user.id,
                targetType: "user"
            }
            await this.client.scheduler.add({
                name: "unban/" + this.guild.id + "/" + user.id,
                date: opt.end,
                path: SCHEDULE_MESSAGER_PATH,
                type: "guild",
                worker: {
                    workerData: data
                }
            });
        }
        return { user, opt };
    }

    /**
     * @param {GuildMember | User} user 
     * @param {{reason: string, notify: boolean, invoked: Date}} param1
     */
    async _execUnban(user, { reason = "No reason provided", notify = true, invoked } = {}) {
        await this.guild.bans.remove(user, reason);
        const res = {
            reason: reason,
            notify: notify,
            invoked: invoked
        };
        if (notify) {
            const emb = new MessageEmbed(this.defaultEmbed)
                .setColor(getColor((user.user || user).accentColor, true, user.displayColor))
                .setDescription(reason)
                .setTitle("Unban")
                .addField("At", "<t:" + unixToSeconds(invoked) + ":F>", true);

            try {
                if (await user.send({ embeds: [emb] }))
                    res.notified = true;
            } catch (e) { logDev(e); res.notified = false; };
        }
        try { await this.client.scheduler.remove("unban/" + this.guild.id + "/" + user.id); }
        catch (e) { logDev(e) };

        return { user, res };
    }

    /**
     * 
     * @param {GuildMember | User} user 
     * @param {MuteOpts} opt
     */
    async _execMute(user, opt) {
        const db = new ShaBaseDb(database, "member/" + this.guild.id + "/" + user.id);
        if (!opt.reason) opt.reason = "No reason provided";

        const get = await db.getOne("muted", "Object");
        const oldMute = get?.value || {};

        const takeRoles = user.roles?.cache.filter(
            r => !r.managed && r.id !== r.guild.id && r.id !== opt.muteRole
        );

        if (user instanceof GuildMember) {
            if (takeRoles.size)
                await user.roles.remove(takeRoles, opt.reason);
            if (!user.roles.resolve(opt.muteRole))
                await user.roles.add(opt.muteRole, opt.reason);
        }

        if (oldMute.takenRoles)
            opt.takenRoles = oldMute.takenRoles;
        else opt.takenRoles = takeRoles?.map(r => r.id);

        if (typeof opt.notify !== "boolean") opt.notify = true;
        if (opt.notify) {
            const emb = new MessageEmbed(this.defaultEmbed)
                .setColor(getColor((user.user || user).accentColor, true, user.displayColor))
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
        db.set("muted", "Object", { value: val });
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
                type: "guild",
                worker: {
                    workerData: data
                }
            });
        }
        return { user, val };
    }

    /**
     * 
     * @param {import("../typins").ShaGuildMember} member 
     * @param {DefaultExecModOpts} opt 
     */
    async _execTimeout(member, opt) {
        if (!opt.reason) opt.reason = "No reason provided";
        const interval = createInterval(opt.invoked, opt.end);
        const duration = intervalToStrings(interval);
        await member.timeout(duration.ms > 2332800841 ? 2332800841 : duration.ms, opt.reason);
        if (typeof opt.notify !== "boolean") opt.notify = true;
        if (opt.notify) {
            const emb = new MessageEmbed(this.defaultEmbed)
                .setColor(getColor(member.user.accentColor, true, member.displayColor))
                .setDescription(opt.reason)
                .setTitle("Timeout")
                .addField("At", "<t:" + unixToSeconds(opt.invoked) + ":F>", true);
            if (opt.end) {
                emb.addField("Until", "<t:" + unixToSeconds(opt.end) + ":F>", true)
                    .addField("For", "`" + duration.strings.join(" ") + "`");
            } else emb.addField("Until", "`Never`", true)
                .addField("For", "`Ever`");
            try {
                if (await member.send({ embeds: [emb] }))
                    opt.notified = true;
            } catch (e) { logDev(e); opt.notified = false; };
        }
        return { member, opt };
    }

    /**
     *
     * @param {GuildMember | User} user
     * @param {DefaultExecModOpts} opt
     */
    async _execUnmute(user, opt) {
        const db = new ShaBaseDb(database, "member/" + this.guild.id + "/" + user.id);
        const get = await db.getOne("muted", "Object");
        const oldOpt = get?.value || {};
        if (!oldOpt.state && !oldOpt.takenRoles?.length) {
            try { await this.client.scheduler.remove("unmute/" + this.guild.id + "/" + user.id); }
            catch (e) { logDev(e) };
            throw new Error("This user isn't muted");
        }
        if (!opt.reason) opt.reason = "No reason provided";
        if (user instanceof GuildMember) {
            if (oldOpt.takenRoles?.length)
                await user.roles.add(oldOpt.takenRoles, opt.reason);
            if (user.roles.resolve(oldOpt.muteRole))
                await user.roles.remove(oldOpt.muteRole, opt.reason);
        } else {
            opt.muteRole = oldOpt.muteRole;
            opt.takenRoles = oldOpt.takenRoles;
        }
        if (typeof opt.notify !== "boolean") opt.notify = true;
        if ((oldOpt.state && opt.notify) || (!oldOpt.state && oldOpt.notified === false)) {
            const emb = new MessageEmbed(this.defaultEmbed)
                .setDescription(opt.reason)
                .setColor(getColor((user.user || user).accentColor, true, user.displayColor))
                .setTitle("Unmute")
                .addField("At", "<t:" + unixToSeconds(opt.invoked) + ":F>");
            try {
                if (await user.send({ embeds: [emb] }))
                    opt.notified = true;
            } catch (e) { logDev(e); opt.notified = false; };
        }

        const val = { ...opt, state: false };
        db.set("muted", "Object", { value: val });
        try { await this.client.scheduler.remove("unmute/" + this.guild.id + "/" + user.id); }
        catch (e) { logDev(e) };

        return { user, val };
    }

    /**
     * @param {GuildMember} member
     * @param {DefaultExecModOpts} opt
     */
    async _execKick(member, opt) {
        if (!opt.reason) opt.reason = "No reason provided";
        if (typeof opt.notify !== "boolean") opt.notify = true;
        if (opt.notify) {
            const emb = new MessageEmbed(this.defaultEmbed)
                .setColor(getColor(member.user.accentColor, true, member.displayColor))
                .setDescription(opt.reason)
                .setTitle("Kick")
                .addField("At", "<t:" + unixToSeconds(opt.invoked) + ":F>", true);
            try {
                if (await member.send({ embeds: [emb] }))
                    opt.notified = true;
            } catch (e) { logDev(e); opt.notified = false; };
        }

        await member.kick(opt.reason);

        return { member, opt };
    }

    /**
     * 
     * @param {import("../typins").ShaGuildMember} member
     * @param {DefaultExecModOpts & ExtendExecVCOpts} opt
     */
    async _execVCDeafen(member, opt) {
        if (!member.voice.channel) return;
        if (!member.voice.channel.permissionsFor(opt.moderator).has("DEAFEN_MEMBERS"))
            throw new Error("Moderator lack DEAFEN_MEMBERS permission");
        if (!member.voice.channel.permissionsFor(member.guild.me).has("DEAFEN_MEMBERS"))
            throw new Error("Client lack DEAFEN_MEMBERS permission");
        if (!opt.reason) opt.reason = "No reason provided";
        if (member.voice.serverDeaf) return;
        await member.voice.setDeaf(true, opt.reason);
        return { member, opt };
    }

    /**
     *
     * @param {import("../typins").ShaGuildMember} member
     * @param {DefaultExecModOpts & ExtendExecVCOpts} opt
     */
    async _execVCUndeafen(member, opt) {
        if (!member.voice.channel) return;
        if (!member.voice.channel.permissionsFor(opt.moderator).has("DEAFEN_MEMBERS"))
            throw new Error("Moderator lack DEAFEN_MEMBERS permission");
        if (!member.voice.channel.permissionsFor(member.guild.me).has("DEAFEN_MEMBERS"))
            throw new Error("Client lack DEAFEN_MEMBERS permission");
        if (!opt.reason) opt.reason = "No reason provided";
        if (!member.voice.serverDeaf) return;
        await member.voice.setDeaf(false, opt.reason);
        return { member, opt };
    }

    /**
     * 
     * @param {import("../typins").ShaGuildMember} member
     * @param {DefaultExecModOpts & ExtendExecVCOpts} opt
     */
    async _execVCMute(member, opt) {
        if (!member.voice.channel) return;
        if (!member.voice.channel.permissionsFor(opt.moderator).has("MUTE_MEMBERS"))
            throw new Error("Moderator lack MUTE_MEMBERS permission");
        if (!member.voice.channel.permissionsFor(member.guild.me).has("MUTE_MEMBERS"))
            throw new Error("Client lack MUTE_MEMBERS  permission");
        if (!opt.reason) opt.reason = "No reason provided";
        if (member.voice.serverMute) return;
        await member.voice.setMute(true, opt.reason);

        return { member, opt };
    }

    /**
     *
     * @param {import("../typins").ShaGuildMember} member
     * @param {DefaultExecModOpts & ExtendExecVCOpts} opt
     */
    async _execVCUnmute(member, opt) {
        if (!member.voice.channel) return;
        if (!member.voice.channel.permissionsFor(opt.moderator).has("MUTE_MEMBERS"))
            throw new Error("Moderator lack MUTE_MEMBERS permission");
        if (!member.voice.channel.permissionsFor(member.guild.me).has("MUTE_MEMBERS"))
            throw new Error("Client lack MUTE_MEMBERS permission");
        if (!opt.reason) opt.reason = "No reason provided";
        if (!member.voice.serverMute) return;
        await member.voice.setMute(false, opt.reason);
        return { member, opt };
    }

    /**
     *
     * @param {import("../typins").ShaGuildMember} member
     * @param {VoiceBasedChannel} VCTarget
     * @param {DefaultExecModOpts & ExtendExecVCOpts} opt
     */
    async _execVCMove(member, VCTarget, opt) {
        if (!member.voice.channel) return;
        if (!member.voice.channel.permissionsFor(opt.moderator).has("MOVE_MEMBERS"))
            throw new Error("Moderator lack MOVE_MEMBERS permission");
        if (!member.voice.channel.permissionsFor(member.guild.me).has("MOVE_MEMBERS"))
            throw new Error("Client lack MOVE_MEMBERS permission");
        if (!opt.reason) opt.reason = "No reason provided";
        await member.voice.setChannel(VCTarget, opt.reason);
        return { member, VCTarget, opt };
    }

    /**
     * 
     * @param {Date} invoked - Invoked at
     * @param {string} durationArg - 425y98w98s87h989mo
     * @param {number} defaultDuration - Fallback
     * @param {number} [minMs=10000] - Default 10 seconds
     * @returns 
     */
    static defaultParseDuration(invoked, durationArg, defaultDuration, minMs = 10000) {
        let end, duration, ms, dur, interval;
        if (durationArg) {
            dur = parseDuration(invoked, durationArg);
            ms = dur.interval?.toDuration().toMillis() || 0;
        } else ms = defaultDuration;
        if (ms < minMs) {
            throw new RangeError("Duration less than minimum ms");
        } else {
            if (dur) {
                end = dur.end;
                duration = dur.duration;
                interval = dur.interval;
            } else {
                end = new Date(invoked.valueOf() + ms);
                interval = createInterval(invoked, end);
                duration = intervalToStrings(interval);
            }
        }
        return { end, duration, interval, ms };
    }
}

class Moderation extends BaseModeration {
    /**
     * @param {ShaClient} client
     * @param {ModerationOpt} param0
     */
    constructor(client, { guild, targets, moderator, channel, VCTarget }) {
        super(client, guild, channel);

        if (!(moderator instanceof GuildMember))
            throw new TypeError("moderator isn't GuildMember");

        if (VCTarget && !(VCTarget instanceof StageChannel) && !(VCTarget instanceof VoiceChannel))
            throw new TypeError("VCTarget isn't VoiceBasedChannel");

        const targetUs = [];
        const targetMs = [];

        if (targets?.length || targets) {
            if (!Array.isArray(targets)) targets = [targets];
            if (targets.some(r => !(r instanceof User) && !(r instanceof GuildMember)))
                throw new TypeError("some target isn't User or GuildMember");

            for (const r of targets) {
                if (targetUs.some(a => a.id === r.id)) continue;
                if (r instanceof User) targetUs.push(r);
                else targetUs.push(r.user);
            }
            for (const r of targets) {
                if (targetMs.some(a => a.id === r.id)) continue;
                const get = this.guild.members.resolve(r);
                if (!(get instanceof GuildMember)) continue;
                targetMs.push(get);
            }
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
         * @type {VoiceBasedChannel}
         */
        this.VCTarget = VCTarget || null;

        /**
         * @type {number}
         */
        this.moderatorPosition = client.isOwner(moderator) ? Infinity : moderator.roles.highest.position;
        /**
         * @type {boolean}
         */
        this.moderatorAdmin = isAdmin(moderator, true);
        /**
         * @type {boolean}
         */
        this.moderatorBanPerm = client.isOwner(moderator) || moderator.permissions.has("BAN_MEMBERS");
        /**
         * @type {boolean}
         */
        this.moderatorKickPerm = client.isOwner(moderator) || moderator.permissions.has("KICK_MEMBERS");
        /**
         * @type {boolean}
         */
        this.moderatorManageRolesPerm = client.isOwner(moderator) || moderator.permissions.has("MANAGE_ROLES");
        /**
         * @type {boolean}
         */
        this.moderatorVCDeafenPerm = client.isOwner(moderator) || this.channel?.permissionsFor(moderator).has("DEAFEN_MEMBERS");
        /**
         * @type {boolean}
         */
        this.moderatorVCMutePerm = client.isOwner(moderator) || this.channel?.permissionsFor(moderator).has("MUTE_MEMBERS");
        /**
         * @type {boolean}
         */
        this.moderatorModerateMembersPerm = client.isOwner(moderator) || moderator.permissions.has("MODERATE_MEMBERS");
        /**
         * @type {number}
         */
        this.clientPosition = this.me.roles.highest.position;
        /**
         * @type {boolean}
         */
        this.clientAdmin = isAdmin(this.me);
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
         * @type {boolean}
         */
        this.clientVCDeafenPerm = this.channel?.permissionsFor(this.me).has("DEAFEN_MEMBERS");
        /**
         * @type {boolean}
         */
        this.clientVCMutePerm = this.channel?.permissionsFor(this.me).has("MUTE_MEMBERS");
        /**
         * @type {boolean}
         */
        this.clientModerateMembersPerm = this.me.permissions.has("MODERATE_MEMBERS");

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
     * @param {BanOpts} opt 
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
            banned.push(await this._execBan(a, opt));
        }
        return { banned, higherThanModerator, higherThanClient };
    }

    /**
     * 
     * @param {{reason: string, notify: boolean, invoked: Date}} opt
     */
    async unban(opt) {
        if (!this.moderatorAdmin)
            throw new Error("Moderator lack ADMINISTRATOR permission");
        if (!this.clientAdmin)
            throw new Error("Client lack ADMINISTRATOR permission");
        const unbanned = [];
        for (const a of this.target.users) {
            unbanned.push(await this._execUnban(a, opt));
        }
        return { unbanned };
    }

    /**
     * 
     * @param {DefaultExecModOpts} opt 
     * @returns 
     */
    async kick(opt) {
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
            kicked.push(await this._execKick(a, opt));
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
     * @param {DefaultExecModOpts} opt
     */
    async unmute(opt) {
        if (!this.moderatorManageRolesPerm)
            throw new Error("Moderator lack MANAGE_ROLES permission");
        if (!this.clientManageRolesPerm)
            throw new Error("Client lack MANAGE_ROLES permission");
        const unmuted = [];
        const higherThanClient = [];
        const higherThanModerator = [];
        for (const a of this.target.users) {
            const m = await this.guild.members.fetch({ user: a }).catch(logDev);
            if (m) {
                if (this.higherThanClient.some(r => r.id === m.id)) {
                    higherThanClient.push(m);
                    continue;
                }
                if (this.higherThanModerator.some(r => r.id === m.id)) {
                    higherThanModerator.push(m);
                    continue;
                }
            }
            unmuted.push(await this._execUnmute(m || a, opt));
        }
        return { unmuted, higherThanClient, higherThanModerator };
    }

    /**
     * @param {DefaultExecModOpts} opt
     */
    async timeout(opt) {
        if (!this.moderatorModerateMembersPerm)
            throw new Error("Moderator lack MODERATE_MEMBERS permission");
        if (!this.clientModerateMembersPerm)
            throw new Error("Client lack MODERATE_MEMBERS permission");
        const timedOut = [];
        const higherThanClient = [];
        const higherThanModerator = [];
        for (const a of this.target.members) {
            // const m = await this.guild.members.fetch({ user: a }).catch(logDev);
            if (this.higherThanClient.some(r => r.id === a.id)) {
                higherThanClient.push(a);
                continue;
            }
            if (this.higherThanModerator.some(r => r.id === a.id)) {
                higherThanModerator.push(a);
                continue;
            }
            timedOut.push(await this._execTimeout(a, opt));
        }
        return { timedOut, higherThanClient, higherThanModerator };
    }

    /**
     * 
     * @param {DefaultExecModOpts & ExtendExecVCOpts} opt 
     * @returns 
     */
    async vcDeafen(opt) {
        if (!opt.moderator) opt.moderator = this.moderator;
        const deafened = [];
        const higherThanClient = [];
        const higherThanModerator = [];
        const noVoice = [];
        for (const a of this.target.members) {
            if (!opt.force && a.id === opt.moderator.id) continue;
            if (this.higherThanModerator.some(r => r.id === a.id)) {
                higherThanModerator.push(a);
                continue;
            }
            const res = await this._execVCDeafen(a, opt);
            if (!res) noVoice.push(a);
            else deafened.push(res);
        }
        return { deafened, higherThanClient, higherThanModerator, noVoice };
    }

    /**
     * 
     * @param {DefaultExecModOpts & ExtendExecVCOpts} opt 
     * @returns 
     */
    async vcUndeafen(opt) {
        if (!opt.moderator) opt.moderator = this.moderator;
        const undeafened = [];
        const higherThanClient = [];
        const higherThanModerator = [];
        const noVoice = [];
        for (const a of this.target.members) {
            if (!opt.force && a.id === opt.moderator.id) continue;
            if (this.higherThanModerator.some(r => r.id === a.id)) {
                higherThanModerator.push(a);
                continue;
            }
            const res = await this._execVCUndeafen(a, opt);
            if (!res) noVoice.push(a);
            else undeafened.push(res);
        }
        return { undeafened, higherThanClient, higherThanModerator, noVoice };
    }

    /**
     * 
     * @param {DefaultExecModOpts & ExtendExecVCOpts} opt 
     * @returns 
     */
    async vcMute(opt) {
        if (!opt.moderator) opt.moderator = this.moderator;
        const muted = [];
        const higherThanClient = [];
        const higherThanModerator = [];
        const noVoice = [];
        for (const a of this.target.members) {
            if (!opt.force && a.id === opt.moderator.id) continue;
            if (this.higherThanModerator.some(r => r.id === a.id)) {
                higherThanModerator.push(a);
                continue;
            }
            const res = await this._execVCMute(a, opt);
            if (!res) noVoice.push(a);
            else muted.push(res);
        }
        return { muted, higherThanClient, higherThanModerator, noVoice };
    }

    /**
     * 
     * @param {DefaultExecModOpts & ExtendExecVCOpts} opt 
     * @returns 
     */
    async vcUnmute(opt) {
        if (!opt.moderator) opt.moderator = this.moderator;
        const unmuted = [];
        const higherThanClient = [];
        const higherThanModerator = [];
        const noVoice = [];
        for (const a of this.target.members) {
            if (!opt.force && a.id === opt.moderator.id) continue;
            if (this.higherThanModerator.some(r => r.id === a.id)) {
                higherThanModerator.push(a);
                continue;
            }
            const res = await this._execVCUnmute(a, opt);
            if (!res) noVoice.push(a);
            else unmuted.push(res);
        }
        return { unmuted, higherThanClient, higherThanModerator, noVoice };
    }

    /**
     * 
     * @param {DefaultExecModOpts & ExtendExecVCOpts} opt 
     * @returns 
     */
    async vcMove(opt) {
        if (!this.VCTarget) throw new Error("No VCTarget specified");
        if (!opt.moderator) opt.moderator = this.moderator;
        const moved = [];
        const higherThanClient = [];
        const higherThanModerator = [];
        const noVoice = [];
        for (const a of this.target.members) {
            if (a.voice.channelId === this.VCTarget.id) continue;
            if (!opt.force && a.id === opt.moderator.id) continue;
            if (this.higherThanModerator.some(r => r.id === a.id)) {
                higherThanModerator.push(a);
                continue;
            }
            const res = await this._execVCMove(a, this.VCTarget, opt);
            if (!res) noVoice.push(a);
            else moved.push(res);
        }
        return { moved, higherThanClient, higherThanModerator, noVoice };
    }
}

module.exports = { BaseModeration, Moderation }
