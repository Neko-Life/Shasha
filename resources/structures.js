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
            const ret = await database.collection("Guild").findOne({document: this.id}).then((r, j) => {
                if (j) return errLog(j, null, this.client);
                this.infractions = r?.moderation?.infractions;
                this.moderation = r?.moderation?.settings;
                this.defaultEmbed = r?.settings?.defaultEmbed;
                this.quoteOTD = r?.settings?.quoteOTD;
                this.eventChannels = r?.settings?.eventChannels;

                return this.dbLoaded = true;
            });
            return ret;
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
                const ret = await database.collection("Guild").updateOne({document: this.id}, {$push:{"moderation.infractions":add}}, (e) => {
                    if (e) return errLog(e, null, this.client);
                    this.infractions.push(add);
                    return true;
                });
                return ret;
            } catch (e) { }
        }
        async setQuoteOTD(set) {
            const ret = await database.collection("Guild").updateOne({document: this.id}, {$set: {"settings.quoteOTD": set}, $setOnInsert: { document: this.id }}, {upsert: true}, (e) => {
                if (e) return errLog(e, null, this.client);
                this.quoteOTD = set;
                return true;
            });
            return ret;
        }
        async setEventChannels(set) {
            const ret = await database.collection("Guild").updateOne({document: this.id}, {$set: {"settings.eventChannels": set}, $setOnInsert: { document: this.id }}, {upsert: true}, (e) => {
                if (e) return errLog(e, null, this.client);
                this.eventChannels = set;
                return true;
            });
            return ret;
        }
        async setDefaultEmbed(set) {
            const ret = await database.collection("Guild").updateOne({document: this.id}, {$set:{"settings.defaultEmbed": set}, $setOnInsert: { document: this.id }}, {upsert: true}, (e) => {
                if (e) return errLog(e, null, this.client);
                this.defaultEmbed = set;
                return true;
            });
            return ret;
        }
        async setModerationSettings(set) {
            const ret = await database.collection("Guild").updateOne({document:this.id}, {$set:{"moderation.settings": set}, $setOnInsert: { document: this.id }}, {upsert: true}, (e) => {
                if (e) return errLog(e, null, this.client);
                this.moderation = set;
                return true;
            });
            return ret;
        }
    }
});

Structures.extend("User", u => {
    return class User extends u {
        constructor(client, data) {
            super(client, data);
            this.dbLoaded = false;
            this.giveHeart = "yes";
        }
        async dbLoad() {
            const ret = await database.collection("User").findOne({document: this.id}).then((r, j) => {
                if (j) return errLog(j, null, this.client);
                this.defaultEmbed = r?.settings?.defaultEmbed;
                this.cachedAvatarURL = this.displayAvatarURL({format: "png", size: 4096, dynamic: true});
                return this.dbLoaded = true;
            });
            return ret;
        }
        async setDefaultEmbed(set) {
            const ret = await database.collection("User").updateOne({document: this.id}, {$set:{"settings.defaultEmbed": set}, $setOnInsert: { document: this.id }}, {upsert: true}, (e) => {
                if (e) return errLog(e, null, this.client);
                this.defaultEmbed = set;
                return true;
            });
            return ret;
        }
    }
});