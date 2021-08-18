'use strict';

const { Structures, Guild, GuildMember, BanOptions, Role, User, Message } = require("discord.js"),
    { MongoClient, Db, Collection } = require("mongodb"),
    { database } = require("../mongo"),
    { errLog, defaultEventLogEmbed, defaultDateFormat, trySend } = require("./functions");
const { createSchedule } = require("../cmds/moderation/src/createSchedule");
const { TimedPunishment } = require("./classes");
const { GUILDFNS } = require("../rsc/StructuresFns");
const col = database.collection("Schedule");

class BaseDBManager {
    #fn;

    /**
     * @typedef {object} data
     * @property {"Guild"|"User"|"GuildMember"|"Schedule"} collection
     * @property {object} fn
     * 
     * @param {Guild|User|GuildMember|import("discord.js").TextBasedChannels|Message} instance
     * @param {data} param1 
     */
    constructor(instance, { collection, fn = {} }) {
        /**
         * @type {Guild|User|GuildMember|import("discord.js").TextBasedChannels|Message}
         */
        this.instance = instance;
        this.client = instance.client;
        if (collection)
            /**
             * @type {Collection}
             */
            this.col = database.collection(collection);
        this.#fn = {};
        for (const U in fn) {
            if (!U) continue;
            this.#fn[U] = fn[U];
        }
    }

    async dbLoad(fn = this.#fn.dbLoad) {
        return this.col.findOne({ document: this.instance.id }).then((r, e) => {
            if (e) // return errLog(e, null, this.client);
                console.error(e);
            if (!r) r = {};
            if (fn) r = fn(r);
            // console.log("DB LOADED FOR GUILD:", this.instance.name, this.instance.id);
            return this.instance.DB = r;
        });
    }


    async setDb(query, set) {
        return this.col.updateOne({ document: this.instance.id }, { $set: { [query]: set }, $setOnInsert: { document: this.instance.id } },
            { upsert: true }).then((r, e) => {
                if (e) // return errLog(e, null, this.client);
                    console.error(e);
                return this.instance.DB[query] = set;
            });
    }
}

class GuildDBManager extends BaseDBManager {
    constructor(instance) {
        super(instance, { collection: "Guild", fn: GUILDFNS });
    }

    /**
     * Get user infractions
     * @param {string} userID - User ID
     * @returns {object[]} Array of infractions objects
     */
    getInfractions(userID) {
        let ret = []
        for (const [k, v] of this.instance.DB.infractions)
            if (v.by.map(r => r.id).includes(userID)) ret.push(v);
        return ret;
    }

    async addInfraction(add) {
        try {
            if (!this.instance.DB) await this.dbLoad();
            console.log("SETTING INF");
            const ret = this.instance.DB.infractions.set(add.moderator.id + "/" + add.infraction, add);
            await this.setDb("infractions", this.instance.DB.infractions);
            return ret;
        } catch (e) { }
    }

    async setQuoteOTD(set) {
        if (!this.instance.DB) await this.dbLoad();
        this.instance.DB.quoteOTD = set;
        return this.setDb("quoteOTD", this.instance.DB.quoteOTD);
    }

    async setEventChannels(set) {
        if (!this.instance.DB) await this.dbLoad();
        this.instance.DB.eventChannels = set;
        return this.setDb("eventChannels", this.instance.DB.eventChannels);
    }

    async setDefaultEmbed(set) {
        if (!this.instance.DB) await this.dbLoad();
        this.instance.DB.defaultEmbed = set;
        return this.setDb("defaultEmbed", this.instance.DB.defaultEmbed);
    }

    async setModerationSettings(set) {
        if (!this.instance.DB) await this.dbLoad();
        this.instance.DB.settings = set;
        return this.setDb("settings", this.instance.DB.settings);
    }

    /**
     * @param {TimedPunishment} Punishment
     * @returns {Map}
     */
    async setTimedPunishment(Punishment) {
        console.log("SET TIMED PUNISHMENT");
        const ret = this.instance.DB.timedPunishments.set(Punishment.userID + "/" + Punishment.type, Punishment);
        await this.setDb("timedPunishments", this.instance.DB.timedPunishments);
        return ret;
    }

    /**
     * @param {string} userID
     * @param {"mute"|"ban"} type
     * @returns
     */
    getTimedPunishment(userID, type) {
        console.log("GET TIMEDPUNISHMENT");
        return this.instance.DB.timedPunishments.get(userID + "/" + type);
    }

    /**
     * @param {string} userID
     * @returns {object[]}
     */
    searchTimedPunishment(userID) {
        let ret = [];
        for (const [k, v] of this.instance.DB.timedPunishments) if (v.userID === userID) ret.push(v);
        return ret;
    }

    /**
     * @param {string} userID 
     * @param {"mute"|"ban"} type 
     * @returns {boolean}
     */
    async removeTimedPunishment(userID, type) {
        const ret = this.instance.DB.timedPunishments.delete(userID + "/" + type);
        await this.setDb("timedPunishments", this.instance.DB.timedPunishments);
        await require("../cmds/moderation/src/createSchedule").jobManager?.stop([this.instance.id, userID, type].join("/")).catch(() => { });
        await require("../cmds/moderation/src/createSchedule").jobManager?.remove([this.instance.id, userID, type].join("/")).catch(() => { });
        console.log("REMOVED TIMEDPUNISHMENT");
        return ret;
    }

    async setCached(key, value) {
        this.instance.DB.cached[key] = value;
        await this.setDb("cached", this.instance.DB.cached);
        console.log("SET CACHED", key, value);
        return this.instance.DB.cached;
    }

    getCached(key) {
        return this.instance.DB.cached[key];
    }

    async updateCached(key, value) {
        const cached = this.getCached(key);
        if (cached === value) return false;
        console.log("UPDATE CACHED", key, cached);
        return this.setCached(key, value);
    }
}

class UserDBManager extends BaseDBManager {
    constructor(instance) {
        super(instance, { collection: "User", fn: {} });
        this.instance.cutie = true;
    }

    async setF(string) {
        if (!this.instance.DB) await this.dbLoad();
        this.instance.DB.F = string;
        return this.setDb("F", this.instance.DB.F);
    }

    async setInteractions(count) {
        if (!this.instance.DB) await this.dbLoad();
        this.instance.DB.interactions = count;
        return this.setDb("interactions", this.instance.DB.interactions);
    }

    async setDescription(set) {
        if (!this.instance.DB) await this.dbLoad();
        this.instance.DB.description = set;
        return this.setDb("description", this.instance.DB.description);
    }

    async setDefaultEmbed(set) {
        if (!this.instance.DB) await this.dbLoad();
        this.instance.DB.defaultEmbed = set;
        return this.setDb("defaultEmbed", this.instance.DB.defaultEmbed);
    }

    /**
     * @param {Guild} guild
     * @param {string} reason
     * @param {{duration: import("./Duration").DurationOut, saveTakenRoles: boolean, infraction: number, moderator: GuildMember}} data
     */
    async mute(guild, data, reason) {
        if (!guild || !(guild instanceof Guild)) throw new TypeError("Guild is: " + guild);
        if (!data || !data.infraction) throw new Error("Missing infraction id");

        const MEM = guild.member(this.instance);
        const CL = guild.member(this.client.user);

        if (!(CL.isAdmin || CL.hasPermission("MANAGE_ROLES")) ||
            !(data.moderator.idAdmin || data.moderator.hasPermission("MANAGE_ROLES"))) throw new Error("Missing Permissions");

        if (MEM) {
            if (data.moderator.roles.highest.position <= MEM.roles.highest.position ||
                MEM.roles.highest.position >= guild.member(this.client.user).roles.highest.position)
                throw new Error("You can't mute someone with higher position than you <:nekokekLife:852865942530949160>");
            await MEM.mute(data, reason);
        }

        if (!guild.DB) await guild.dbLoad();

        if (!this.instance.bot) {
            const emb = defaultEventLogEmbed(guild);
            emb.setTitle("You have been muted")
                .setDescription(reason || "No reason provided")
                .addField("At", defaultDateFormat(data.duration.invoked), true)
                .addField("Until", data.duration.until ? defaultDateFormat(data.duration.until) : "Never", true)
                .addField("For", data.duration.duration?.strings.join(" ") || "Indefinite");
            this.instance.createDM().then(r => trySend(this.client, r, emb));
        }

        const MC = guild.getTimedPunishment(this.instance.id, "mute"),
            TP = new TimedPunishment({ userID: this.instance.id, duration: data.duration, infraction: data.infraction, type: "mute" });

        if (data.duration.until) await createSchedule(guild.client, { guildID: guild.id, userID: this.instance.id, type: "mute", until: data.duration.until?.toJSDate() });

        return { set: await guild.setTimedPunishment(TP), existing: MC }
    }

    /**
     * @param {Guild} guild
     * @param {GuildMember} moderator
     * @param {string} reason
     * @returns 
     */
    async unmute(guild, moderator, reason) {
        if (!guild || !(guild instanceof Guild)) throw new TypeError("Guild is: " + guild);
        const MEM = guild.member(this.instance);
        const CL = guild.member(this.client.user);
        if (!(CL.isAdmin || CL.hasPermission("MANAGE_ROLES")) ||
            !(moderator.idAdmin || moderator.hasPermission("MANAGE_ROLES"))) throw new Error("Missing Permissions");
        if (!guild.DB) await guild.dbLoad();

        if (!this.instance.bot) {
            const emb = defaultEventLogEmbed(guild);

            emb.setTitle("You have been unmuted")
                .setDescription(reason || "No reason provided");

            this.instance.createDM().then(r => trySend(this.client, r, emb));
        }

        const MC = guild.getTimedPunishment(this.instance.id, "mute");
        if (!MC) throw new Error(this.instance.tag + " isn't muted in " + guild.name);
        if (MEM) {
            if (moderator.roles.highest.position < MEM.roles.highest.position ||
                MEM.roles.highest.position > CL.roles.highest.position)
                throw new Error("You can't mute someone with higher position than you <:nekokekLife:852865942530949160>");
            await MEM.unmute(reason);
        }
        await col.deleteOne({ document: [guild.id, this.instance.id, "mute"].join("/") }).then(() => console.log("SCHEDULE " + [guild.id, this.instance.id, "mute"].join("/") + " DELETED")).catch(e => errLog(e, null, client));
        return guild.removeTimedPunishment(this.instance.id, "mute");
    }

    /**
     * @param {Guild} guild
     * @param {{duration: import("./Duration").DurationOut, infraction: number, moderator: GuildMember}} data
     * @param {BanOptions} option
     */
    async ban(guild, data, option) {
        if (!guild || !(guild instanceof Guild)) throw new TypeError("Guild is: " + guild);
        if (!data || !data.infraction) throw new Error("Missing infraction id");
        const MEM = guild.member(this.instance);
        const CL = guild.member(this.client.user);
        if (!(CL.isAdmin || CL.hasPermission("BAN_MEMBERS")) ||
            !(data.moderator.isAdmin || data.moderator.hasPermission("BAN_MEMBERS"))) throw new Error("Missing Permissions");
        if (MEM) {
            if (data.moderator.roles.highest.position <= MEM.roles.highest.position ||
                MEM.roles.highest.position >= CL.roles.highest.position)
                throw new Error("You can't ban someone with higher position than you <:nekokekLife:852865942530949160>");
        }
        if (!guild.DB) await guild.dbLoad();

        if (!this.instance.bot) {
            const emb = defaultEventLogEmbed(guild);
            emb.setTitle("You have been banned")
                .setDescription(option.reason || "No reason provided")
                .addField("At", defaultDateFormat(data.duration.invoked), true)
                .addField("Until", data.duration.until ? defaultDateFormat(data.duration.until) : "Never", true)
                .addField("For", data.duration.duration?.strings.join(" ") || "Indefinite");
            await this.instance.createDM().then(r => trySend(this.client, r, emb));
        }
        let already = false, cant = false;
        if (option.days > 7) option.days = 7;
        await guild.members.ban(this.instance, option);
        //     .catch(e => {

        // });
        if (data.duration.until) await createSchedule(guild.client, { guildID: guild.id, userID: this.instance.id, type: "ban", until: data.duration.until?.toJSDate() });

        const MC = guild.getTimedPunishment(this.instance.id, "ban"),
            TP = new TimedPunishment({ userID: this.instance.id, duration: data.duration, infraction: data.infraction, type: "ban" });

        return { set: await guild.setTimedPunishment(TP), existing: MC, already: already, cant: cant }
    }

    async unban(guild, moderator, reason) {
        if (!guild || !(guild instanceof Guild)) throw new TypeError("Guild is: " + guild);
        const CL = guild.member(this.client.user);
        if (!moderator.isAdmin || !CL.isAdmin) throw new Error("Missing permissions");
        let already = false, cant = false;
        await guild.members.unban(this.instance, reason).catch(e => {
            if (!/Unknown Ban/.test(e.message)) {
                throw new Error(e.message);
            };
        });
        // .catch(e => {

        // });
        if (!guild.DB) await guild.DB.dbLoad();

        if (!this.instance.bot) {
            const emb = defaultEventLogEmbed(guild);

            emb.setTitle("You have been unbanned")
                .setDescription(reason || "No reason provided");
            this.instance.createDM().then(r => trySend(this.client, r, emb));
        }
        await col.deleteOne({ document: [guild.id, this.instance.id, "ban"].join("/") }).then(() => console.log("SCHEDULE " + [guild.id, this.instance.id, "ban"].join("/") + " DELETED")).catch(e => errLog(e, null, client));
        return { set: await guild.removeTimedPunishment(this.instance.id, "ban"), already: already, cant: cant };
    }
}

Structures.extend("TextChannel", u => {
    return class TextChannel extends u {
        constructor(guild, data) {
            super(guild, data);
            this.instance.lastMessagesID = [];
        };

        pushLastMessagesID() {
            if (this.instance.lastMessagesID.length === 3) {
                this.instance.lastMessagesID.shift();
            };
            return this.instance.lastMessagesID.push(this.instance.lastMessageID);
        };
    }
});

Structures.extend("DMChannel", u => {
    return class DMChannel extends u {
        constructor(client, data) {
            super(client, data);
            this.instance.lastMessagesID = [];
        };

        pushLastMessagesID() {
            if (this.instance.lastMessagesID.length === 3) {
                this.instance.lastMessagesID.shift();
            };
            return this.instance.lastMessagesID.push(this.instance.lastMessageID);
        };
    }
});

Structures.extend("NewsChannel", u => {
    return class NewsChannel extends u {
        constructor(guild, data) {
            super(guild, data);
            this.instance.lastMessagesID = [];
        };

        pushLastMessagesID() {
            if (this.instance.lastMessagesID.length === 3) {
                this.instance.lastMessagesID.shift();
            };
            return this.instance.lastMessagesID.push(this.instance.lastMessageID);
        };
    }
});

Structures.extend("StoreChannel", u => {
    return class StoreChannel extends u {
        constructor(guild, data) {
            super(guild, data);
            this.instance.lastMessagesID = [];
        };

        pushLastMessagesID() {
            if (this.instance.lastMessagesID.length === 3) {
                this.instance.lastMessagesID.shift();
            };
            return this.instance.lastMessagesID.push(this.instance.lastMessageID);
        };
    }
});

Structures.extend("Message", e => {
    return class Message extends e {
        constructor(client, data, channel) {
            super(client, data, channel);
            this.instance.previousMessageID = channel.lastMessageID;
        };

        setInvoker(user) {
            return this.instance.invoker = user;
        };
    };
});

Structures.extend("GuildMember", u => {
    return class GuildMember extends u {
        constructor(client, data, guild) {
            super(client, data, guild);
        }

        async dbLoad() {
            return database.collection("GuildMember").findOne({ document: this.instance.guild.id + "/" + this.instance.id }).then((r, e) => {
                if (e) return errLog(e, null, this.client);
                if (!r) r = {};
                // console.log("DB LOADED FOR MEMBER:", this.instance.user.tag, this.instance.id, this.instance.guild.name, this.instance.guild.id);
                return this.instance.DB = r;
            });
        }

        async setDb(query, set) {
            return database.collection("GuildMember").updateOne({ document: this.instance.guild.id + "/" + this.instance.id }, { $set: { [query]: set }, $setOnInsert: { document: this.instance.guild.id + "/" + this.instance.id } },
                { upsert: true }).then((r, e) => {
                    if (e) return errLog(e, null, this.client);
                    return this.instance.DB[query] = set;
                });
        }

        get infractions() {
            return this.instance.guild.getInfractions(this.instance.id);
        }

        /**
         * @param {{duration: import("./Duration").DurationOut, saveTakenRoles: boolean, infraction: number}} data
         * @param {string} reason
         * @returns
         */
        async mute(data, reason) {
            if (!this.instance.DB) await this.dbLoad();
            if (!data || !data.infraction) throw new Error("Missing infraction id");
            if (!this.instance.DB.muted) this.instance.DB.muted = {};
            if (data.saveTakenRoles === undefined) data.saveTakenRoles = !(this.instance.DB.muted.takenRoles?.length);

            const ROLES = this.instance.roles.cache.filter((r) => !r.managed).map(r => r.id);
            if (data.saveTakenRoles && ROLES?.length) {
                console.log("POPULATING TAKEN ROLES BEFORE MUTE");
                this.instance.DB.muted.takenRoles = ROLES;
            }
            this.instance.DB.muted.muteRole = this.instance.guild.DB.settings.mute.role;

            try {
                if (ROLES?.length) await this.instance.roles.remove(ROLES, reason);
                await this.instance.roles.add(this.instance.DB.muted.muteRole, reason);
                if (!this.instance.DB.muted.takenRoles) this.instance.DB.muted.takenRoles = [];
                await this.setDb("muted", this.instance.DB.muted);
                return true;
            } catch (e) {
                if (this.instance.DB.muted.takenRoles?.length) await this.instance.roles.add(this.instance.DB.muted.takenRoles, reason).catch(() => { });
                if (this.instance.DB.muted.muteRole) await this.instance.roles.remove(this.instance.DB.muted.muteRole, reason).catch(() => { });
                console.log("CLEAR TAKEN ROLES MUTE ERROR");
                this.instance.DB.muted.takenRoles = [];
                this.instance.DB.muted.muteRole = undefined;
                throw e;
            }
        }

        async unmute(reason) {
            if (!this.instance.DB) await this.dbLoad();
            try {
                if (this.instance.DB.muted.takenRoles.length) await this.instance.roles.add(this.instance.DB.muted.takenRoles, reason);
                if (this.instance.DB.muted.muteRole) await this.instance.roles.remove(this.instance.DB.muted.muteRole, reason);
                console.log("CLEAR TAKEN ROLES UNMUTE");
                this.instance.DB.muted.takenRoles = [];
                this.instance.DB.muted.muteRole = undefined;
                await this.setDb("muted", this.instance.DB.muted);
                return true;
            } catch (e) {
                throw e;
            }
        }

        /**
         * @param {string[]} roles
         */
        async setLeaveRoles(roles = []) {
            if (!this.instance.DB) await this.dbLoad();
            const kicked = (await this.instance.guild.fetchAuditLogs({ "limit": 1, "type": "MEMBER_KICK" }).catch(() => { }))?.entries?.first();
            if (kicked?.target.id === this.instance.id) {
                // console.log("KICKED:", true);
                return;
            }
            const banned = await this.instance.guild.fetchBan(this.instance.user).catch(() => { });
            // console.log("BANNED:", banned ? true : false);
            if (banned) return;
            return this.setDb("leaveRoles", roles);
        }

        get isAdmin() { if (!this.client.owners.includes(this.instance.user)) return this.instance.hasPermission("ADMINISTRATOR"); else return true }
    }
});