'use strict';

const { Structures, Guild, GuildMember, BanOptions } = require("discord.js"),
    { database } = require("../database/mongo"),
    { errLog } = require("./functions");
const { DateTime, Duration } = require("luxon");

Structures.extend("Guild", u => {
    return class Guild extends u {
        constructor(client, data) {
            super(client, data);
        }

        async dbLoad() {
            return database.collection("Guild").findOne({ document: this.id }).then((r, e) => {
                if (e) return errLog(e, null, this.client);
                r = r?.DB;
                if (!r) r = {};
                if (!r.settings) r.settings = {};
                if (!r.moderation) r.moderation = {};
                if (!r.settings.eventChannels) r.settings.eventChannels = {};
                if (!r.moderation.settings) r.moderation.settings = {};
                if (!r.moderation.infractions) r.moderation.infractions = new Map();
                if (!r.moderation.timedPunishments) r.moderation.timedPunishments = new Map();
                return this.DB = r;
            });
        }

        async setDb(Db, empty = false) {
            if (typeof Db !== "object") throw new TypeError("Expected 'object'; Got '" + typeof Db + "'");
            if (Db === {} && !empty) throw new TypeError("Empty!");
            return database.collection("Guild").updateOne({ document: this.id }, { $set: { DB: Db }, $setOnInsert: { document: this.id } },
                { upsert: true }).then((r, e) => {
                    if (e) return errLog(e, null, this.client);
                    return this.DB = Db;
                });
        }

        /**
         * @param {object} data - Data to set
         * @returns 
         */
        async refreshDb(data) {
            if (!this.DB) await this.dbLoad();
            if (data) for (const D in data) if (this.DB[D]) this.DB[D] = data[D];
            return this.setDb(this.DB);
        }

        /**
         * Get user infractions
         * @param {String} get - User ID
         * @returns {Promise<Map>} Array of infractions objects
         */
        async getInfractions(get) {
            try {
                if (!this.DB) await this.dbLoad();
                return this.DB.moderation.infractions.filter(r => r.map(u => u.id).includes(get));
            } catch (e) { }
        }

        async addInfraction(add) {
            try {
                if (!this.DB) await this.dbLoad();
                this.DB.moderation.infractions.push(add);
                return this.setDb(this.DB);
            } catch (e) { }
        }

        async setQuoteOTD(set) {
            if (!this.DB) await this.dbLoad();
            this.DB.settings.quoteOTD = set;
            return this.setDb(this.DB);
        }

        async setEventChannels(set) {
            if (!this.DB) await this.dbLoad();
            this.DB.settings.eventChannels = set;
            return this.setDb(this.DB);
        }

        async setDefaultEmbed(set) {
            if (!this.DB) await this.dbLoad();
            this.DB.settings.defaultEmbed = set;
            return this.setDb(this.DB);
        }

        async setModerationSettings(set) {
            if (!this.DB) await this.dbLoad();
            this.DB.moderation.settings = set;
            return this.setDb(this.DB);
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
                r = r?.DB;
                if (!r) r = {};
                if (!r.F) r.F = "<:pepewhysobLife:853237646666891274>";
                if (!r.cachedAvatarURL) r.cachedAvatarURL = this.displayAvatarURL({ format: "png", size: 4096, dynamic: true });
                if (!r.mutedIn) r.mutedIn = [];
                if (!r.interactions) r.interactions = {};
                return this.DB = r;
            });
        }

        async setDb(Db, empty = false) {
            if (typeof Db !== "object") throw new TypeError("Expected 'object'; Got '" + typeof Db + "'");
            if (Db === {} && !empty) throw new TypeError("Empty!");
            return database.collection("User").updateOne({ document: this.id }, { $set: { DB: Db }, $setOnInsert: { document: this.id } },
                { upsert: true }).then((r, e) => {
                    if (e) return errLog(e, null, this.client);
                    return this.DB = Db;
                });
        }

        /**
         * @param {object} data - Data to set
         * @returns 
         */
        async refreshDb(data) {
            if (!this.DB) await this.dbLoad();
            if (data) for (const D in data) if (this.DB[D]) this.DB[D] = data[D];
            return this.setDb(this.DB);
        }

        async setF(string) {
            if (!this.DB) await this.dbLoad();
            this.DB.F = string;
            return this.setDb(this.DB);
        }

        async setInteractions(count) {
            if (!this.DB) await this.dbLoad();
            this.DB.interactions = count;
            return this.setDb(this.DB);
        }

        async setDescription(set) {
            if (!this.DB) await this.dbLoad();
            this.DB.description = set;
            return this.setDb(this.DB);
        }

        async setDefaultEmbed(set) {
            if (!this.DB) await this.dbLoad();
            this.DB.defaultEmbed = set;
            return this.setDb(this.DB);
        }

        /**
         * @param {string} guildID
         * @param {{state: boolean, duration: object, infraction: number}} state
         * @returns {number}
         */
        pushMutedIn(guildID, { state: state = true, duration: duration, infraction: infraction }) {
            const push = {
                guildID: guildID,
                state: state,
                duration: duration,
                infraction: infraction
            }
            return this.DB.mutedIn.push(push);
        }

        removeMutedIn(guildID) {
            return this.DB.mutedIn = this.DB.mutedIn.filter((r) => r.guildID !== guildID);
        }

        /**
         * @param {string} guildID 
         * @returns {{data: {state: boolean, duration: duration, infraction: number, guildID: string}, index: number, count: number}}
         */
        getMutedIn(guildID) {
            let index = -1;
            const hmm = this.DB.mutedIn.filter((r, i) => {
                if (r.guildID === guildID) {
                    index = i;
                    return true;
                } else return false;
            }),
                data = hmm?.[0],
                count = hmm?.length || 0;
            const D = { data, index, count };
            console.log(D);
            return D;
        }

        /**
         * @param {string} guildID
         * @param {{state: boolean, duration: object, infraction: number}} state
         * @returns {{state: boolean, duration: object, infraction: number, guildID: string}}
         */
        updateMutedIn(guildID, { state: state = true, duration: duration, infraction: infraction }) {
            const I = this.getMutedIn(guildID)?.index;
            if (I === -1) return false;
            const push = {
                guildID: guildID,
                state: state,
                duration: duration,
                infraction: infraction
            };
            this.DB.mutedIn[I] = push;
            return this.DB.mutedIn[I];
        }

        /**
         * @param {Guild} guild 
         * @param {string} reason
         * @param {{duration: object, saveTakenRoles: boolean, infraction: number, moderator: GuildMember}} data
         */
        async mute(guild, data, reason) {
            if (!guild || !(guild instanceof Guild)) throw new TypeError("Guild is " + typeof guild);
            if (!data?.infraction) throw new Error("Missing infraction id");
            if (!this.DB) await this.dbLoad();
            if (!guild.DB) await guild.dbLoad();
            const MEM = guild.member(this);
            if (MEM) {
                if (data.moderator.roles.highest.position < MEM.roles.highest.position) throw new Error("You can't mute someone with higher position than you <:nekokekLife:852865942530949160>");
                return MEM.mute(data, reason)
            } else {
                const MC = this.getMutedIn(guild.id);
                if (MC?.index > -1) {
                    if (data.duration && MC.data) {
                        const ret = this.updateMutedIn(guild.id, { state: true, duration: data.duration, infraction: MC.data.infraction });
                        this.setDb(this.DB);
                        return ret;
                    };
                    throw new Error("This member is already muted. Provide `[duration]` to set new duration.");
                }
                const ret = this.pushMutedIn(guild.id, { state: true, duration: data.duration, infraction: data.infraction });
                this.setDb(this.DB);
                return ret;
            };
        }

        async unmute(guild, moderator, reason) {
            if (!guild || !(guild instanceof Guild)) throw new TypeError("Guild is " + typeof guild);
            if (!this.DB) await this.dbLoad();
            const MEM = guild.member(this);
            if (MEM) {
                if (moderator.roles.highest.position < MEM.roles.highest.position) throw new Error("You can't mute someone with higher position than you <:nekokekLife:852865942530949160>");
                return MEM.unmute(reason)
            } else {
                const ret = this.removeMutedIn(guild.id);
                this.setDb(this.DB);
                return ret;
            }
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

        async setDb(Db, empty = false) {
            if (typeof Db !== "object") throw new TypeError("Expected 'object'; Got '" + typeof Db + "'");
            if (Db === {} && !empty) throw new TypeError("Empty!");
            return database.collection("GuildMember").updateOne({ document: this.id }, { $set: { DB: Db }, $setOnInsert: { document: this.id } },
                { upsert: true }).then((r, e) => {
                    if (e) return errLog(e, null, this.client);
                    return this.DB = Db;
                });
        }

        /**
         * @param {object} data - Data to set
         * @returns 
         */
        async refreshDb(data) {
            if (!this.DB) await this.dbLoad();
            if (data) for (const D in data) if (this.DB[D]) this.DB[D] = data[D];
            return this.setDb(this.DB);
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
            if (!this.user.DB) await this.user.dbLoad();
            if (!this.guild.DB) await this.guild.dbLoad();
            if (!data) throw new Error("Missing infraction id");

            const MC = this.user.getMutedIn(this.guild.id);
            if (!data.infraction && !MC?.data) throw new Error("Missing infraction id");

            if (MC?.index > -1) {
                if (data.duration && MC.data) {
                    const ret = this.user.updateMutedIn(this.guild.id, { state: true, duration: data.duration, infraction: MC.data.infraction });
                    this.user.setDb(this.user.DB);
                    return ret;
                }
                throw new Error("This member is already muted. Provide `[duration]` to set new duration.");
            }
            if (data.saveTakenRoles === undefined) data.saveTakenRoles = true;
            const ROLES = this.roles.cache.filter((r) => !r.managed).map(r => r.id);
            if (data.saveTakenRoles && ROLES?.length > 0) {
                console.log("populating takenRoles M");
                this.DB.takenRoles = ROLES;
            }
            this.DB.muteRole = this.guild.DB.moderation.settings.mute.role;

            try {
                if (ROLES?.length > 0) await this.roles.remove(ROLES, reason);
                await this.roles.add(this.DB.muteRole, reason);
                const ret = this.user.pushMutedIn(this.guild.id, {
                    state: true,
                    duration: data.duration,
                    infraction: data.infraction
                });
                this.setDb(this.DB);
                this.user.setDb(this.user.DB);
                return ret;
            } catch (e) {
                if (this.DB.takenRoles?.length > 0) await this.roles.add(this.DB.takenRoles, reason).catch(() => { });
                if (this.DB.muteRole) await this.roles.remove(this.DB.muteRole, reason).catch(() => { });
                this.user.removeMutedIn(this.guild.id);
                console.log("clear takenRoles M");
                this.DB.takenRoles = [];
                this.DB.muteRole = undefined;
                throw e;
            }
        }

        async unmute(reason) {
            if (!this.DB) await this.dbLoad();
            if (!this.user.DB) await this.user.dbLoad();
            try {
                if (this.DB.takenRoles.length > 0) await this.roles.add(this.DB.takenRoles, reason);
                if (this.DB.muteRole) await this.roles.remove(this.DB.muteRole, reason);
                const ret = this.user.removeMutedIn(this.guild.id);
                console.log("clear takenRoles UM");
                this.DB.takenRoles = [];
                this.DB.muteRole = undefined;
                this.setDb(this.DB);
                this.user.setDb(this.user.DB)
                return ret;
            } catch (e) {
                throw e;
            }
        }

        get isAdmin() { if (!this.client.owners.includes(this.user)) return this.hasPermission("ADMINISTRATOR"); else return true }
    }
});