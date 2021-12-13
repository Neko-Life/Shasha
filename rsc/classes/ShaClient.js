'use strict';

const { ChildProcess } = require("child_process");
const { Client, User, Guild, Collection, MessageEmbed } = require("discord.js");
const { join } = require("path");
const requireAll = require("require-all");
const { ShaBaseDb } = require("./Database");
const { adCheck, cleanMentionID, createRegExp } = require("../functions");
const { escapeRegExp } = require("lodash");
const { logDev } = require("../debug");
const { Events } = require("discord.js/src/util/Constants");
/**
 * @type {typeof import("./Scheduler").Scheduler}
 */
let Scheduler;

module.exports = class ShaClient extends Client {
    /**
     * 
     * @param {import("discord.js").ClientOptions} options 
     */
    constructor(options) {
        super(options);
        /**
         * @type {User[]}
         */
        this.owners = [];
        this.eventHandlers = null;
        this.handlers = null;
        this.commands = null;
        this.messageInteraction = null;
        this.functions = null;
        this.handledCommands = new Map();
        this.activeMessageInteractions = new Map();
        this.loadedListeners = {};
        this.devListeners = {};
        /**
         * @type {ChildProcess}
         */
        this.dashboard = options.dashboard || null;
        /**
         * @type {ShaBaseDb}
         */
        this.db = options.db || null;
        this.bannedGuilds = null;
        this.bannedUsers = null;

        /**
         * @type {import("./Scheduler").Scheduler}
         */
        this.scheduler = null;
    }

    dispatch() {
        try {
            this.unloadModules();
            this.loadModules();
            this.dispatchListeners("on");
            this.dispatchDashboard();
            this.loadDbMessageInteractions();
        } catch (e) { process.emit("error", e) }
        this.loadBannedGuilds();
        this.loadBannedUsers();
    }

    loadModules() {
        logDev("Loading modules...");
        this.eventHandlers = requireAll({ dirname: join(__dirname, "../eventHandlers") });
        this.handlers = requireAll({ dirname: join(__dirname, "../handlers") });
        this.commands = requireAll({ dirname: join(__dirname, "../cmds"), recursive: true });
        this.messageInteraction = requireAll({ dirname: join(__dirname, "../messageInteraction"), recursive: true });
        this.functions = require("../functions");
        requireAll({ dirname: join(__dirname, "../rsc") });
        requireAll({ dirname: join(__dirname, "../classes") });
        requireAll({ dirname: join(__dirname, "../util") });
        require("../constants");
        Scheduler = require("./Scheduler").Scheduler;
        logDev("Modules unload/load done");
    }

    unloadModules() {
        logDev("Unloading modules...");
        const modulesDirName = ["../classes", "../eventHandlers", "../handlers", "../cmds", "../messageInteraction", "../rsc", "../util"];
        const modulesName = ["../functions.js", "../constants.js"];
        const modulesDirPath = modulesDirName.map(r => join(__dirname, r));
        modulesDirPath.push(...modulesName.map(r => join(__dirname, r)));
        Scheduler = null;
        this.dispatchListeners();
        for (const R in require.cache) {
            if (modulesDirPath.some(r => new RegExp("^" + escapeRegExp(r)).test(R))) {
                delete require.cache[R];
                logDev("unloaded module:", R);
            }
        }
    }

    /**
     * 
     * @param {"off"|"on"} opt
     */
    dispatchListeners(opt = "off") {
        logDev((opt === "on" ? "Dispatching" : "Removing") + " listeners...");
        if (opt !== "on" && opt !== "off") throw new TypeError("Expected 'on' or 'off'. Got " + opt);
        let count = 0;
        for (const U in this.eventHandlers) {
            if (opt === "on") this.loadedListeners[U] = async (...args) => {
                // logDev("[ EVENT", U, "]", ...args);
                this.eventHandlers[U].handle(this, ...args);
            }
            this[opt](U, this.loadedListeners[U]);
            logDev("Listener", U, (opt === "on" ? "dispatched" : "removed"));
            count++;
        }
        if (process.dev) for (const k in Events) {
            if (k === "RAW" || k === "PRESENCE_UPDATE") continue;
            if (opt === "on") this.devListeners[k] = (...args) => {
                logDev("[%s]", Events[k], ...args);
            }
            if (this.devListeners[k])
                this[opt](Events[k], this.devListeners[k]);
        }
        logDev(count, `listeners ${opt === "off" ? "un" : ""}loaded`);
    }

    dispatchDashboard() {
        if (!(this.dashboard instanceof ChildProcess)) return;
        this.dashboard.on("spawn", () =>
            console.log("Dashboard initialized..."));

        this.dashboard.on("message", (msg, sendHandle) =>
            console.log("[ DASHBOARD_MESSAGE ]\n%s", msg,
                "SEND_HANDLE:\n%s", sendHandle), "\n[ END:DASHBOARD_MESSAGE ]");

        this.dashboard.on("exit", (c, s) =>
            console.warn("[ DASHBOARD_EXIT ]\n%s", "CODE:", c, "SIG:\n%s", s, "\n[ END:DASHBOARD_EXIT ]"));

        this.dashboard.on("error", (e) =>
            console.error("[ DASHBOARD_ERROR ]\n%s", e, "\n[ END:DASHBOARD_ERROR ]"));

        this.dashboard.on("disconnect", () =>
            console.warn("Dashboard got disconnected..."));

        this.dashboard.on("close", (c, s) =>
            console.warn("[ DASHBOARD_CLOSED ]\n%s", "CODE:", c, "SIG:\n%s", s, "\n[ END:DASHBOARD_CLOSED ]"));

        // this.dashboard.stdout.on("data", (c) =>
        //     console.log("[ DASHBOARD_STDOUT ]\n%s", c, "\n[ END:DASHBOARD_STDOUT ]"));

        // this.dashboard.stderr.on("data", (c) =>
        //     console.log("[ DASHBOARD_STDERR ]\n%s", c, "\n[ END:DASHBOARD_STDERR ]"));
    }

    async loadScheduler() {
        logDev("Initializing scheduler...");
        const schedules = await Scheduler.loadSchedules(this);
        this.scheduler = new Scheduler(this, schedules);
        logDev("Scheduler initialized");
    }

    /**
     * 
     * @param {import("../typins").ShaGuild} guild 
     */
    async loadOwnerGuildCommand(guild) {
        logDev("Enabling owner in guild", guild.name, guild.id);
        this.application.commands.fetch().then(
            async r => {
                const log = await r.find(r => r.name === "owner")
                    ?.permissions.set({
                        guild: guild,
                        permissions: [{
                            id: "750335181285490760",
                            type: "USER",
                            permission: true
                        }]
                    });
                logDev(log);
                logDev("Enabled owner in guild", guild.name, guild.id);
            }
        );
    }

    /**
     * Emotify str and check for ads
     * @param {string} str 
     * @param {boolean} noAdCheck 
     * @returns {string}
     */
    finalizeStr(str, noAdCheck = false) {
        let ret = this.emoteReplace(str);
        if (!noAdCheck) ret = adCheck(ret);
        return ret;
    }

    /**
     * 
     * @param {MessageEmbed} embed 
     * @param {boolean} noAdCheck 
     * @returns 
     */
    finalizeEmbed(embed, noAdCheck = false) {
        const newEmb = new MessageEmbed(embed);
        if (embed.description?.length) newEmb.setDescription(this.finalizeStr(embed.description, noAdCheck));
        if (embed.title?.length) newEmb.setTitle(this.finalizeStr(embed.title, noAdCheck));
        if (embed.author?.name?.length) newEmb.author.name = this.finalizeStr(embed.author.name, noAdCheck);
        if (embed.footer?.text?.length) newEmb.footer.text = this.finalizeStr(embed.footer.text, noAdCheck);
        for (let i = 0; i < embed.fields.length; i++) {
            newEmb.fields[i] = {
                name: this.finalizeStr(embed.fields[i].name, noAdCheck),
                value: this.finalizeStr(embed.fields[i].value, noAdCheck),
                inline: embed.fields[i].inline
            }
        }
        if (!noAdCheck) {
            delete newEmb.author?.url;
            delete newEmb.url;
        }
        return newEmb;
    }

    /**
     * 
     * @param {string} id
     * @param {{TIMEOUT:number|boolean, CURRENT_PAGE:string|number, PAGES:{}|[]}} data
     * @returns 
     */
    async createMessageInteraction(id, data) {
        const ret = this.activeMessageInteractions.set(id, data);
        if (typeof data.TIMEOUT !== "number" && typeof data.TIMEOUT !== "boolean")
            data.TIMEOUT = true;
        if (data.TIMEOUT === true) data.TIMEOUT = 60 * 1000 * 15;
        if (typeof data.TIMEOUT === "number" && data.TIMEOUT > 0)
            setTimeout(() => this.activeMessageInteractions.delete(id), data.TIMEOUT);
        else await this.db.set("activeMessageInteractions", id, data);
        return ret;
    }

    async loadDbMessageInteractions() {
        const get = await this.db.get("activeMessageInteractions", String);
        if (get.size)
            for (const [k, v] of get)
                this.activeMessageInteractions.set(k, v);
    }

    async deleteMessageInteractions(id) {
        this.activeMessageInteractions.delete(id);
        return this.db.delete("activeMessageInteractions", id);
    }

    /**
     * Check if user is this owner
     * @param {User | GuildMember | string} user
     * @returns {boolean}
     */
    isOwner(user) {
        if (user.id) user = user.id;
        if (typeof user !== "string")
            throw new TypeError("Expected string, got " + typeof user);
        return this.owners.some(r => r.id === user);
    }

    /**
     * Find guild with id or exact name, force will use RegExp
     * @param {string} query
     * @param {string} reFlags - RegExp flags (force)
     * @param {boolean} force
     * @param {boolean} exact
     * @returns {Collection<string, Guild> | Guild}
     */
    findGuilds(query, reFlags, force = false, exact = false) {
        if (typeof query !== "string") throw new TypeError("query must be a string!");
        query = cleanMentionID(query);
        if (!query) return;
        if (/^\d{17,20}$/.test(query))
            return this.guilds.resolve(query);
        else if (force) {
            const re = createRegExp(query, reFlags, exact);
            return this.guilds.cache.filter(v =>
                re.test(v.name)
            );
        } else {
            return this.guilds.cache.filter(v =>
                v.name === query
            );
        }
    }

    /**
     * @param {string} query 
     * @param {string} reFlags 
     * @returns {Collection<string, User> | Promise<User>}
     */
    async findUsers(query, reFlags) {
        if (typeof query !== "string") throw new TypeError("query must be a string!");
        query = cleanMentionID(query);
        if (!query) return;
        if (/^\d{17,20}$/.test(query)) {
            let u = this.users.resolve(query);
            if (!u) u = await this.users.fetch(query).catch(logDev);
            return u;
        } else {
            const re = createRegExp(query, reFlags);
            return this.users.cache.filter(r =>
                re.test(r.username) || re.test(r.tag));
        }
    }

    emoteReplace(content) {
        const E = content?.match(/:[\w-_]{1,32}:(?!\d{17,20}>)/g);
        if (!E || !E.length) return content;
        const tE = [];
        for (const eN of E) {
            const findThis = eN.slice(1, -1).toLowerCase();
            const found = this.emojis.cache.filter(r => r.name.toLowerCase() === findThis).first();
            tE.push(found);
        }
        if (tE.length && tE.some(r => !!r)) {
            for (let index = 0; index < E.length; index++) {
                if (!tE[index]) continue;
                content = content.replace(E[index], `<${tE[index].animated ? "a" : ""}:${tE[index].name}:${tE[index].id}>`);
            }
        }
        return content;
    }

    async loadBannedGuilds() {
        if (Array.isArray(this.bannedGuilds)) return this.bannedGuilds;
        const get = await this.db.getOne("bannedGuilds", "String[]");
        return this.bannedGuilds = get?.value || [];
    }

    async loadBannedUsers() {
        if (Array.isArray(this.bannedUsers)) return this.bannedUsers;
        const get = await this.db.getOne("bannedUsers", "String[]");
        return this.bannedUsers = get?.value || [];
    }

    /**
     * 
     * @param {Guild} guild 
     * @returns 
     */
    async banGuild(guild) {
        return this._execCommandBan(guild, "Guild");
    }

    async banUser(user) {
        return this._execCommandBan(user, "User");
    }

    /**
     * 
     * @param {*} inst 
     * @param {"Guild" | "User"} type 
     * @returns 
     */
    async _execCommandBan(inst, type) {
        const id = Array.isArray(inst) ? inst : [inst];
        let cInstance;
        if (id.some(r => r instanceof User) || type === "User") {
            cInstance = User;
            type = "User";
        } else if (id.some(r => r instanceof Guild) || type === "Guild") {
            cInstance = Guild;
            type = "Guild";
        } else throw new TypeError("Unknown type " + type + " of " + inst);
        await this["loadBanned" + type + "s"]();
        const banned = [];
        const already = [];
        const error = [];
        for (let r of id) {
            const ori = r;
            if (r instanceof cInstance) r = r.id;
            if (typeof r !== "string") {
                error.push("Expected string. Got " + typeof id + " of " + r);
                continue;
            };
            if (!/^\d{17,20}$/.test(r)) {
                error.push("Invalid id: " + r);
                continue;
            };
            if (this["banned" + type + "s"].includes(r)) {
                if (!already.some(a => (a.id || a) === r)) already.push(ori);
                continue;
            }
            this["banned" + type + "s"].push(r);
            banned.push(ori);
        };
        const db = await this.db.set(
            "banned" + type + "s", "String[]",
            { value: this["banned" + type + "s"] }
        );
        return { banned, already, error, db };
    }

    async unbanGuild(guild) {
        return this._execCommandUnban(guild, "Guild");
    }

    async unbanUser(user) {
        return this._execCommandUnban(user, "User");
    }

    /**
     * 
     * @param {*} inst 
     * @param {"Guild"|"User"} type 
     * @returns 
     */
    async _execCommandUnban(inst, type) {
        const id = Array.isArray(inst) ? inst : [inst];
        let cInstance;
        if (id.some(r => r instanceof User) || type === "User") {
            cInstance = User;
            type = "User";
        } else if (id.some(r => r instanceof Guild) || type === "Guild") {
            cInstance = Guild;
            type = "Guild";
        } else throw new TypeError("Unknown type " + type + " of " + inst);
        await this["loadBanned" + type + "s"]();
        const unbanned = [];
        const already = [];
        for (let r of id) {
            const ori = r;
            if (r instanceof cInstance) r = r.id;
            if (!this["banned" + type + "s"].includes(r)) {
                if (!already.some(a => (a.id || a) === r)) already.push(ori);
                continue;
            }
            this["banned" + type + "s"].splice(this["banned" + type + "s"].indexOf(r), 1);
            unbanned.push(ori);
        }
        const db = await this.db.set(
            "banned" + type + "s", "String[]",
            { value: this["banned" + type + "s"] }
        );
        return { unbanned, already, db };
    }

    /**
     * 
     * @param {import("discord.js").GuildMemberResolvable} user 
     * @returns {Collection<string, Guild>}
     */
    findMutualGuilds(user) {
        return this.guilds.cache.filter(r => r.members.resolve(user));
    }
}