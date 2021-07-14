'use strict';

const { Structures } = require("discord.js"),
    { database } = require("../database/mongo"),
    { errLog } = require("./functions");

Structures.extend("Guild", u => {
    return class Guild extends u {
        constructor(client, data) {
            super(client, data);
        }

        async dbLoad() {
            return database.collection("Guild").findOne({ document: this.id }, (e, r) => {
                if (e) return errLog(e, null, this.client);
                return this.DB = r || {};
            });
        }

        async setDb(Db, empty = false) {
            if (typeof Db !== "object") throw new TypeError("Expected 'object'; Got '" + typeof Db + "'");
            if (Db === {} && !empty) throw new Error("Empty!");
            return database.collection("Guild").updateOne({ document: this.id }, { $set: Db, $setOnInsert: { document: this.id } },
                { upsert: true }, (e) => {
                    if (e) return errLog(e, null, this.client);
                    return this.DB = Db;
                });
        }

        /**
         * Get user infractions
         * @param {String} get - User ID
         * @returns {Promise<Object[]>} Array of infractions objects
         */
        async getInfractions(get) {
            try {
                if (!this.DB) await this.dbLoad();
                let found = [];
                if (this.DB.moderation?.infractions?.length > 0) {
                    for (const inf of this.DB.moderation.infractions) {
                        for (const user of inf.by) {
                            if (user.id === get) {
                                found.push(inf);
                                break;
                            }
                        }
                    }
                }
                return found;
            } catch (e) { }
        }

        async addInfraction(add) {
            try {
                if (!this.DB) await this.dbLoad();
                if (!this.DB.moderation?.infractions) this.DB.moderation.infractions = [];
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
            return database.collection("User").findOne({ document: this.id }, (e, r) => {
                if (e) return errLog(e, null, this.client);
                if (!r.F) r.F = "F";
                return this.DB = r || {};
            });
        }

        async setDb(Db, empty = false) {
            if (typeof Db !== "object") throw new TypeError("Expected 'object'; Got '" + typeof Db + "'");
            if (Db === {} && !empty) throw new Error("Empty!");
            return database.collection("User").updateOne({ document: this.id }, { $set: Db, $setOnInsert: { document: this.id } },
                { upsert: true }, (e) => {
                    if (e) return errLog(e, null, this.client);
                    return this.DB = Db;
                });
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
            return database.collection("GuildMember").findOne({ document: this.id }, (e, r) => {
                if (e) return errLog(e, null, this.client);
                return this.DB = r || {};
            });
        }

        async setDb(Db, empty = false) {
            if (typeof Db !== "object") throw new TypeError("Expected 'object'; Got '" + typeof Db + "'");
            if (Db === {} && !empty) throw new Error("Empty!");
            return database.collection("GuildMember").updateOne({ document: this.id }, { $set: Db, $setOnInsert: { document: this.id } },
                { upsert: true }, (e) => {
                    if (e) return errLog(e, null, this.client);
                    return this.DB = Db;
                });
        }

        async infractions() {
            return this.guild.getInfractions(this.id);
        }

        /**
         * @param {Date | number} until 
         * @returns 
         */
        async mute(until) {
            if (!this.DB) await this.dbLoad();
            if (!this.guild.DB) await this.guild.dbLoad();
            this.DB.takenRoles = this.roles.cache.map(r => r.id);
            this.DB.muteRole = this.guild.DB.moderation.settings.mute.role;
            if ((typeof until) === "number") until = new Date(until);
            try {
                const RM = await this.roles.remove(this.DB.takenRoles);
                await RM.roles.add(this.DB.muteRole);
                this.DB.muted = {
                    state: true,
                    until: until
                };
                return this.setDb(this.DB);
            } catch (e) {
                if (this.DB.takenRoles?.length > 0) this.roles.add(this.DB.takenRoles).catch(() => { });
                this.DB.takenRoles = [];
                this.DB.muteRole = undefined;
                this.DB.muted = { state: false };
                const R = await this.setDb(this.DB);
                if (e) throw e;
                return R;
            }
        }

        async unmute() {
            if (!this.DB) await this.dbLoad();
            try {
                const RM = await this.roles.add(this.DB.takenRoles);
                await RM.roles.remove(this.DB.muteRole);
                this.DB.takenRoles = [];
                this.DB.muteRole = undefined;
                this.DB.muted = { state: false };
                return this.setDb(this.DB);
            } catch (e) {
                if (e) throw e;
                return;
            }
        }
    }
});