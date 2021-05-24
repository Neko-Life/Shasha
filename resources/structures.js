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
         * @param {User} get - User object
         * @returns {Array<Object>} Infractions object
         */
        async getInfractions(get) {
            let found;
            if (this.infractions.length > 0) {
                found = [];
                this.infractions.map(r => {
                    if (r) {
                        for (const inf of r) {
                            if (inf?.by) {
                                if (inf.by.includes(get)) {
                                    found.push(inf);
                                }
                            }
                        }
                    }
                });
            }
            return found;
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