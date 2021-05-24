'use strict';

const { Structures, User } = require("discord.js"),
{ database } = require("../database/mongo");

Structures.extend("Guild", g => {
    return class Guild extends g {
        constructor(client, data) {
            super(client, data);
            database.collection("Guild").findOne({document: this.id}).then(r => {
                this.infractions = r?.moderation?.infractions;
                this.moderation = r?.moderation?.settings;
                this.defaultEmbed = r?.settings?.defaultEmbed;
            }).catch(() => {});
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
                        let added = false;
                        for (const user of inf.by) {
                            if (user.id === get) {
                                found.push(inf);
                                break;
                            }
                        }
                    }
                    if (found.length > 0) {
                        return found;
                    }
                }
            } catch (e) { }
        }
        async setDefaultEmbed(set) {
            await database.collection("Guild").updateOne({document: this.id}, {$set:{"settings.defaultEmbed": set}}, {upsert: true}).catch(e => {throw e});
            this.defaultEmbed = set;
            return true;
        }
        async setModerationSettings(set) {
            await database.collection("Guild").updateOne({document:this.id}, {$set:{"moderation.settings": set}}, {upsert: true}).catch(e => {throw e});
            this.moderation = set;
            return true;
        }
    }
});

Structures.extend("User", u => {
    return class User extends u {
        constructor(client, data) {
            super(client, data);
            database.collection("User").findOne({document: this.id}).then(r => this.defaultEmbed = r?.settings?.defaultEmbed).catch(() => {});
        }
        async setDefaultEmbed(set) {
            await database.collection("User").updateOne({document: this.id}, {$set:{"settings.defaultEmbed": set}}, {upsert: true}).catch(e => {throw e});
            this.defaultEmbed = set;
            return true;
        }
    }
});