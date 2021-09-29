'use strict';

const { Client, User } = require("discord.js");
const { join } = require("path");
const requireAll = require("require-all");
const { adCheck, cleanMentionID, createRegExp } = require("../functions");

module.exports = class ShaClient extends Client {
    constructor(options) {
        super(options);
        /**
         * @type {User[]}
         */
        this.owners = [];
        this.eventHandlers = {};
        this.handlers = {};
        this.commands = {};
        this.selectMenus = {};
        this.functions = {};
        this.handledCommands = new Map();
        this.activeSelectMenus = new Map();
    }

    dispatch() {
        this.loadModules();
        let count = 0;
        for (const U in this.eventHandlers) {
            this.on(U, async (...args) => {
                if (process.dev) console.debug("[ EVENT", U, "]", ...args);
                this.eventHandlers[U].handle(this, ...args);
            });
            if (process.dev) console.debug("Listener", U, "dispatched");
            count++;
        }
        console.log(count, "listeners loaded.");
    }

    loadModules() {
        this.eventHandlers = requireAll({ dirname: join(__dirname, "../eventHandlers") });
        this.handlers = requireAll({ dirname: join(__dirname, "../handlers") });
        this.commands = requireAll({ dirname: join(__dirname, "../cmds"), recursive: true });
        this.selectMenus = requireAll({ dirname: join(__dirname, "../selectMenus"), recursive: true });
        this.functions = require("../functions");
    }

    /**
     * Emotify str and check for ads
     * @param {string} str 
     * @param {boolean} noAdCheck 
     * @returns {string}
     */
    finalizeStr(str, noAdCheck = false) {
        let ret = this.emoteMessage(str);
        if (!noAdCheck) ret = adCheck(str);
        return ret;
    }

    /**
     * Check if user is this owner
     * @param {User | GuildMember | string} user
     * @returns {boolean}
     */
    isOwner(user) {
        if (user.id && /^\d{17,19}$/.test(user.id)) user = user.id;
        if (typeof user !== "string" || (typeof user === "string" && !/^\d{17,19}$/.test(user)))
            throw new TypeError("user is " + user);
        return this.owners.map(r => r.id).includes(user);
    }

    /**
     * Fing guild with id or exact name, force will use RegExp
     * @param {string} query 
     * @param {string} reFlags 
     * @param {boolean} force
     * @returns {Promise<Map<string, Guild>> | Guild}
     */
    async findGuilds(query, reFlags, force = false) {
        if (typeof query !== "string") throw new TypeError("query must be a string!");
        query = cleanMentionID(query);
        if (!query) return;
        if (/^\d{17,19}/.test(query))
            return this.guilds.resolve(query);
        else if (force) {
            const re = createRegExp(query, reFlags);
            return this.guilds.cache.filter(v =>
                re.test(v.name)
            );
        } else {
            return this.guilds.cache.filter(v =>
                v.name === query
            );
        }
    }

    emoteMessage(content) {
        const E = content?.match(/:\w{1,32}:(?!\d{17,19}>)/g);
        if (!E || E.length === 0) return content;
        let tE = [];
        for (const eN of E) {
            let findThis = eN.slice(1, -1);
            let found = this.emojis.cache.map(r => r).filter(r => r.name.toLowerCase() === findThis.toLowerCase())?.[0];
            tE.push(found);
        }
        if (tE.length > 0) {
            for (let index = 0; index < E.length; index++) {
                if (tE[index]) {
                    content = content.replace(E[index], `<${tE[index].animated ? "a" : ""}:${tE[index].name}:${tE[index].id}>`);
                }
            }
        }
        return content;
    }
}