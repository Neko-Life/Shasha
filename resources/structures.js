'use strict';

const { Structures } = require("discord.js"),
    { database } = require("../database/mongo"),
    { errLog } = require("./functions");

Structures.extend("Guild", g => {
    return class Guild extends g {
        constructor(client, data) {
            super(client, data);
            this.dbLoaded = false;
        }

        async dbLoad() {
            return database.collection("Guild").findOne({ document: this.id }).then((r, e) => {
                if (e) return errLog(e, null, this.client);
                this.infractions = r?.moderation?.infractions || [];
                this.moderation = r?.moderation?.settings || {};
                this.defaultEmbed = r?.settings?.defaultEmbed || {};
                this.quoteOTD = r?.settings?.quoteOTD || {};
                this.eventChannels = r?.settings?.eventChannels || {};

                return this.dbLoaded = true;
            });
        }

        /**
         * Get user infractions
         * @param {String} get - User ID
         * @returns {Promise<Object[]>} Infractions object
         */
        async getInfractions(get) {
            try {
                const r = await database.collection("Guild").findOne({ document: this.id });
                this.infractions = r?.moderation?.infractions;
                let found = [];
                if (this.infractions.length > 0) {
                    for (const inf of this.infractions) {
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
                const r = await database.collection("Guild").findOne({ document: this.id });
                this.infractions = r?.moderation?.infractions;
                return database.collection("Guild").updateOne({ document: this.id }, { $push: { "moderation.infractions": add } }, (e) => {
                    if (e) return errLog(e, null, this.client);
                    this.infractions.push(add);
                    return true;
                });
            } catch (e) { }
        }

        async setQuoteOTD(set) {
            return database.collection("Guild").updateOne({ document: this.id }, { $set: { "settings.quoteOTD": set }, $setOnInsert: { document: this.id } }, { upsert: true }, (e) => {
                if (e) return errLog(e, null, this.client);
                this.quoteOTD = set;
                return true;
            });
        }

        async setEventChannels(set) {
            return database.collection("Guild").updateOne({ document: this.id }, { $set: { "settings.eventChannels": set }, $setOnInsert: { document: this.id } }, { upsert: true }, (e) => {
                if (e) return errLog(e, null, this.client);
                this.eventChannels = set;
                return true;
            });
        }

        async setDefaultEmbed(set) {
            return database.collection("Guild").updateOne({ document: this.id }, { $set: { "settings.defaultEmbed": set }, $setOnInsert: { document: this.id } }, { upsert: true }, (e) => {
                if (e) return errLog(e, null, this.client);
                this.defaultEmbed = set;
                return true;
            });
        }

        async setModerationSettings(set) {
            return database.collection("Guild").updateOne({ document: this.id }, { $set: { "moderation.settings": set }, $setOnInsert: { document: this.id } }, { upsert: true }, (e) => {
                if (e) return errLog(e, null, this.client);
                this.moderation = set;
                return true;
            });
        }
    }
});

Structures.extend("User", u => {
    return class User extends u {
        constructor(client, data) {
            super(client, data);
            this.dbLoaded = false;
            this.cutie = true;
            this.F = "F";
        }

        async setF(string) {
            return database.collection("User").updateOne({ document: this.id }, { $set: { F: string }, $setOnInsert: { document: this.id } }, { upsert: true }, (e, r) => {
                if (e) return errLog(e, null, this.client);
                this.F = string;
                return true;
            });
        }

        async dbLoad() {
            return database.collection("User").findOne({ document: this.id }).then((r, e) => {
                if (e) return errLog(e, null, this.client);
                this.defaultEmbed = r?.settings?.defaultEmbed || {};
                this.cachedAvatarURL = this.displayAvatarURL({ format: "png", size: 4096, dynamic: true });
                this.interactions = r?.interactions || {};
                this.description = r?.description;
                this.F = r?.F;
                return this.dbLoaded = true;
            });
        }

        async setInteractions(count) {
            return database.collection("User").updateOne({ document: this.id }, { $set: { interactions: count }, $setOnInsert: { document: this.id } }, { upsert: true }, (e, r) => {
                if (e) return errLog(e, null, this.client);
                this.interactions = count;
                return true;
            });
        }

        async setDescription(set) {
            return database.collection("User").updateOne({ document: this.id }, { $set: { description: set }, $setOnInsert: { document: this.id } }, { upsert: true }, (e, r) => {
                if (e) return errLog(e, null, this.client);
                this.description = set;
                return true;
            });
        }

        async setDefaultEmbed(set) {
            return database.collection("User").updateOne({ document: this.id }, { $set: { "settings.defaultEmbed": set }, $setOnInsert: { document: this.id } }, { upsert: true }, (e) => {
                if (e) return errLog(e, null, this.client);
                this.defaultEmbed = set;
                return true;
            });
        }
    }
});

Structures.extend("TextChannel", e => {
    return class TextChannel extends e {
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

Structures.extend("DMChannel", e => {
    return class DMChannel extends e {
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

Structures.extend("GuildMember", e => {
    return class GuildMember extends e {
        constructor(client, data, guild) {
            super(client, data, guild);
        }

        async infractions() {
            return this.guild.getInfractions(this.id);
        }
    }
});