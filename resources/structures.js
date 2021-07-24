'use strict';

const { Structures, Guild, GuildMember, BanOptions } = require("discord.js"),
    { database } = require("../database/mongo"),
    { errLog } = require("./functions");
const { TimedPunishment } = require("./classes");

Structures.extend("Guild", u => {
    return class Guild extends u {
        constructor(client, data) {
            super(client, data);
        }

        async dbLoad() {
            return database.collection("Guild").findOne({ document: this.id }).then((r, e) => {
                if (e) return errLog(e, null, this.client);
                if (!r) r = {};
                if (!r.eventChannels) r.eventChannels = {};
                if (!r.settings) r.settings = {};
                let infractions = new Map(),
                    timedPunishments = new Map();
                if (r.infractions)
                    for (const U in r.infractions)
                        infractions.set(U, r.infractions[U]);
                if (r.timedPunishments)
                    for (const U in r.timedPunishments) {
                        const tr = new TimedPunishment(r.timedPunishments[U]);
                        tr.setDataDuration(tr.duration.invoked, tr.duration.until);
                        console.log(timedPunishments.set(U, tr));
                    }
                r.infractions = infractions;
                r.timedPunishments = timedPunishments;
                return this.DB = r;
            });
        }

        async setDb(query, set) {
            return database.collection("Guild").updateOne({ document: this.id }, { $set: { [query]: set }, $setOnInsert: { document: this.id } },
                { upsert: true }).then((r, e) => {
                    if (e) return errLog(e, null, this.client);
                    return this.DB[query] = set;
                });
        }

        /**
         * Get user infractions
         * @param {string} userID - User ID
         * @returns {object[]} Array of infractions objects
         */
        async getInfractions(userID) {
            let ret = []
            for (const [k, v] of this.DB.infractions)
                if (v.by.map(r => r.id).includes(userID)) ret.push(v);
            return ret;
        }

        async addInfraction(add) {
            try {
                if (!this.DB) await this.dbLoad();
                console.log("SETTING INF");
                const ret = this.DB.infractions.set(add.infraction, add);
                console.log(ret);
                await this.setDb("infractions", this.DB.infractions);
                return ret;
            } catch (e) { }
        }

        async setQuoteOTD(set) {
            if (!this.DB) await this.dbLoad();
            this.DB.quoteOTD = set;
            return this.setDb("quoteOTD", this.DB.quoteOTD);
        }

        async setEventChannels(set) {
            if (!this.DB) await this.dbLoad();
            this.DB.eventChannels = set;
            return this.setDb("eventChannels", this.DB.eventChannels);
        }

        async setDefaultEmbed(set) {
            if (!this.DB) await this.dbLoad();
            this.DB.defaultEmbed = set;
            return this.setDb("defaultEmbed", this.DB.defaultEmbed);
        }

        async setModerationSettings(set) {
            if (!this.DB) await this.dbLoad();
            this.DB.settings = set;
            return this.setDb("settings", this.DB.settings);
        }

        /**
         * @param {TimedPunishment} Punishment
         * @returns {Map}
         */
        async setTimedPunishment(Punishment) {
            console.log("SET TIMED PUNISHMENT");
            const ret = this.DB.timedPunishments.set(Punishment.userID + "/" + Punishment.type, Punishment);
            await this.setDb("timedPunishments", this.DB.timedPunishments);
            return ret;
        }

        /**
         * @param {string} userID
         * @param {"mute"|"ban"} type
         * @returns
         */
        getTimedPunishment(userID, type) {
            console.log("GET TIMEDPUNISHMENT");
            return this.DB.timedPunishments.get(userID + "/" + type);
        }

        /**
         * @param {string} userID
         * @returns {object[]}
         */
        searchTimedPunishment(userID) {
            let ret = [];
            for (const [k, v] of this.DB.timedPunishments) if (v.userID === userID) ret.push(v);
            return ret;
        }

        /**
         * 
         * @param {string} userID 
         * @param {"mute"|"ban"} type 
         * @returns {boolean}
         */
        async removeTimedPunishment(userID, type) {
            console.log("REMOVE TIMEDPUNISHMENT");
            const ret = this.DB.timedPunishments.delete(userID + "/" + type);
            console.log(ret);
            await this.setDb("timedPunishments", this.DB.timedPunishments);
            return ret;
        }
    }
});

Structures.extend("User", u => {
    return class User extends u {
        constructor(client, data) {
            super(client, data);
            this.cutie = true;
        }

        async dbLoad() {
            return database.collection("User").findOne({ document: this.id }).then((r, e) => {
                if (e) return errLog(e, null, this.client);
                if (!r) r = {};
                if (!r.F) r.F = "<:pepewhysobLife:853237646666891274>";
                if (!r.cachedAvatarURL) r.cachedAvatarURL = this.displayAvatarURL({ format: "png", size: 4096, dynamic: true });
                if (!r.interactions) r.interactions = {};
                return this.DB = r;
            });
        }

        async setDb(query, set) {
            return database.collection("User").updateOne({ document: this.id }, { $set: { [query]: set }, $setOnInsert: { document: this.id } },
                { upsert: true }).then((r, e) => {
                    if (e) return errLog(e, null, this.client);
                    return this.DB[query] = set;
                });
        }

        async setF(string) {
            if (!this.DB) await this.dbLoad();
            this.DB.F = string;
            return this.setDb("F", this.DB.F);
        }

        async setInteractions(count) {
            if (!this.DB) await this.dbLoad();
            this.DB.interactions = count;
            return this.setDb("interactions", this.DB.interactions);
        }

        async setDescription(set) {
            if (!this.DB) await this.dbLoad();
            this.DB.description = set;
            return this.setDb("description", this.DB.description);
        }

        async setDefaultEmbed(set) {
            if (!this.DB) await this.dbLoad();
            this.DB.defaultEmbed = set;
            return this.setDb("defaultEmbed", this.DB.defaultEmbed);
        }

        /**
         * @param {Guild} guild 
         * @param {string} reason
         * @param {{duration: object, saveTakenRoles: boolean, infraction: number, moderator: User}} data
         */
        async mute(guild, data, reason) {
            if (!guild || !(guild instanceof Guild)) throw new TypeError("Guild is " + typeof guild);
            if (!data?.infraction) throw new Error("Missing infraction id");
            if (!guild.DB) await guild.dbLoad();
            const MEM = guild.member(this);
            if (MEM) {
                if (data.moderator.roles.highest.position < MEM.roles.highest.position) throw new Error("You can't mute someone with higher position than you <:nekokekLife:852865942530949160>");
                await MEM.mute(data, reason);
            }
            const MC = guild.getTimedPunishment(this.id, "mute"),
                TP = new TimedPunishment({ userID: this.id, duration: data.duration, infraction: data.infraction, type: "mute" });
            return { set: await guild.setTimedPunishment(TP), existing: MC }
        }

        async unmute(guild, moderator, reason) {
            if (!guild || !(guild instanceof Guild)) throw new TypeError("Guild is " + typeof guild);
            if (!guild.DB) await guild.dbLoad();
            const MC = guild.getTimedPunishment(this.id, "mute");
            if (!MC) throw new Error(this.tag + " isn't muted in " + guild.name);
            const MEM = guild.member(this);
            if (MEM) {
                if (moderator.roles.highest.position < MEM.roles.highest.position) throw new Error("You can't mute someone with higher position than you <:nekokekLife:852865942530949160>");
                await MEM.unmute(reason);
            }
            return guild.removeTimedPunishment(this.id, "mute");
        }

        /**
         * @param {Guild} guild
         * @param {BanOptions} option
         */
        async ban(guild, option) {
            guild.members.ban(this, option);
        }
    }
});

Structures.extend("TextChannel", u => {
    return class TextChannel extends u {
        constructor(guild, data) {
            super(guild, data);
            this.lastMessagesID = [];
        };

        pushLastMessagesID() {
            if (this.lastMessagesID.length === 3) {
                this.lastMessagesID.shift();
            };
            return this.lastMessagesID.push(this.lastMessageID);
        };
    }
});

Structures.extend("DMChannel", u => {
    return class DMChannel extends u {
        constructor(client, data) {
            super(client, data);
            this.lastMessagesID = [];
        };

        pushLastMessagesID() {
            if (this.lastMessagesID.length === 3) {
                this.lastMessagesID.shift();
            };
            return this.lastMessagesID.push(this.lastMessageID);
        };
    }
});

Structures.extend("Message", e => {
    return class Message extends e {
        constructor(client, data, channel) {
            super(client, data, channel);
            this.previousMessageID = channel.lastMessageID;
        };

        setInvoker(user) {
            return this.invoker = user;
        };
    };
});

Structures.extend("GuildMember", u => {
    return class GuildMember extends u {
        constructor(client, data, guild) {
            super(client, data, guild);
        }

        async dbLoad() {
            return database.collection("GuildMember").findOne({ document: this.id }).then((r, e) => {
                if (e) return errLog(e, null, this.client);
                r = r?.DB;
                if (!r) r = {};
                return this.DB = r;
            });
        }

        async setDb(query, set) {
            return database.collection("GuildMember").updateOne({ document: this.id }, { $set: { [query]: set }, $setOnInsert: { document: this.id } },
                { upsert: true }).then((r, e) => {
                    if (e) return errLog(e, null, this.client);
                    return this.DB[query] = set;
                });
        }

        async infractions() {
            return this.guild.getInfractions(this.id);
        }

        /**
         * @param {{duration: object, saveTakenRoles: boolean, infraction: number}} data
         * @param {string} reason
         * @returns
         */
        async mute(data, reason) {
            if (!this.DB) await this.dbLoad();
            if (!data || !data.infraction) throw new Error("Missing infraction id");
            if (data.saveTakenRoles === undefined) data.saveTakenRoles = true;

            const ROLES = this.roles.cache.filter((r) => !r.managed).map(r => r.id);
            if (data.saveTakenRoles && ROLES?.length > 0) {
                console.log("populating takenRoles M");
                this.DB.muted.takenRoles = ROLES;
            }
            this.DB.muted.muteRole = this.guild.DB.mute.role;

            try {
                if (ROLES?.length > 0) await this.roles.remove(ROLES, reason);
                await this.roles.add(this.DB.muted.muteRole, reason);
                await this.setDb("muted", this.DB.muted);
                return true;
            } catch (e) {
                if (this.DB.muted.takenRoles?.length > 0) await this.roles.add(this.DB.muted.takenRoles, reason).catch(() => { });
                if (this.DB.muted.muteRole) await this.roles.remove(this.DB.muted.muteRole, reason).catch(() => { });
                console.log("clear takenRoles M");
                this.DB.muted.takenRoles = [];
                this.DB.muted.muteRole = undefined;
                throw e;
            }
        }

        async unmute(reason) {
            if (!this.DB) await this.dbLoad();
            try {
                if (this.DB.muted.takenRoles.length > 0) await this.roles.add(this.DB.muted.takenRoles, reason);
                if (this.DB.muted.muteRole) await this.roles.remove(this.DB.muted.muteRole, reason);
                console.log("clear takenRoles UM");
                this.DB.muted.takenRoles = [];
                this.DB.muted.muteRole = undefined;
                await this.setDb("muted", this.DB.muted);
                return true;
            } catch (e) {
                throw e;
            }
        }

        get isAdmin() { if (!this.client.owners.includes(this.user)) return this.hasPermission("ADMINISTRATOR"); else return true }
    }
});