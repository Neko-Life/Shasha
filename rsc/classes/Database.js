'use strict';

const { Db, Collection } = require("mongodb");
const { logDev } = require("../debug");

const ENUM_SHADOCS = {
    doc: 0,
    schedules: 1,
    activeMessageInteractions: 2,
    commandDisabled: 3,
    bannedGuilds: 4,
    bannedUsers: 5,
    infractions: 6,
    interactions: 7,
    recentAutocomplete: 8,
    muted: 9,
    muteSettings: 10,
    banned: 11,
    banSettings: 12,
    afkState: 13,
    messageLinkPreviewSettings: 14,
    reminder: 15,
    action: 16,
    invites: 17,
    inviter: 18,
};

const ENUM_SHADOCSTYPES = {
    "String": 1,
    "Object": 2,
    "Number": 3,
    "Boolean": 4,
    "String[]": 5,
    "Object[]": 6,
    "Number[]": 7,
    "Boolean[]": 8,
    "${Id}": 9,
};

const ENUM_SHACOLTYPES = {
    "user/${user.id}": 1,
    "guild/${guild.id}": 2,
    "member/${guild.id}/${member.id}": 3,
    "channel/${channel.id}": 4,
    "reminder": 5,
    "message/${message.channelId}/${message.id}": 6,
}

/**
 * @typedef {keyof ENUM_SHADOCS} ShaDbDocument
 * @typedef {keyof ENUM_SHADOCSTYPES} ShaDbQuery
 * @typedef {keyof ENUM_SHACOLTYPES} ShaDbCollectionType - Types with "/" followed by Id
 */

class ShaBaseDb {
    /**
     * @param {Db} Db
     * @param {ShaDbCollectionType} collection
     */
    constructor(Db, collection) {
        /**
         * @type {Db}
         */
        this.db = Db;
        /**
         * @type {Collection}
         */
        this.col = Db.collection(collection);
    }

    /**
     * 
     * @param {ShaDbDocument} doc
     * @param {ShaDbQuery} query
     * @returns {Promise<Map<string, object>>}
     */
    async get(doc, query) {
        const find = {};
        if (doc !== undefined && query !== undefined) find[doc] = query;
        logDev("get", this.col.collectionName, doc, query, find);
        if (doc && typeof doc !== "string") throw new TypeError("doc must be a string, got " + typeof doc);
        const cursor = this.col.find(find);
        let i = 0;
        let arr = await cursor.toArray();
        if (doc)
            arr = arr.filter(r => r[doc]);
        return new Map(arr.map(r => [([undefined, null].includes(r[doc]) ? i++ : r[doc]), r]));
    }

    /**
     *
     * @param {ShaDbDocument} doc
     * @param {ShaDbQuery} query
     * @returns {Promise<object>}
     */
    async getOne(doc, query) {
        logDev("getOne", this.col.collectionName, doc, query);
        return this.col.findOne({ [doc]: query });
    }

    /**
     * 
     * @param {ShaDbDocument} doc 
     * @param {ShaDbQuery} query 
     * @param {object} val 
     * @param {boolean} push 
     * @returns 
     */
    async set(doc, query, val, push) {
        logDev("set", this.col.collectionName, doc, query, val, push);
        if (typeof doc !== "string") throw new TypeError("doc must be a string, got " + typeof doc);
        if (typeof query !== "string") throw new TypeError("query must be a string, got " + typeof query);
        if (typeof val !== 'object') throw new TypeError("val must be a type of object, got " + typeof val);
        return this.col.updateOne({ [doc]: query },
            push ? {
                $push: val,
                $setOnInsert: { [doc]: query }
            } : {
                $set: val,
                $setOnInsert: { [doc]: query }
            },
            { upsert: true });
    }

    /**
     * 
     * @param {ShaDbDocument} doc 
     * @param {ShaDbQuery} query 
     * @returns 
     */
    async delete(doc, query) {
        logDev("delete", this.col.collectionName, doc, query);
        if (typeof doc !== "string") throw new TypeError("doc must be a string, got " + typeof doc);
        if (typeof query !== "string") throw new TypeError("query must be a type of string, got " + typeof query);
        return this.col.deleteOne({ [doc]: query });
    }

    /**
     * 
     * @param {ShaDbDocument} doc 
     * @param {ShaDbQuery} query 
     * @param {object} val 
     * @returns 
     */
    async push(doc, query, val) {
        return this.set(doc, query, val, true);
    }
}

module.exports = { ShaBaseDb }