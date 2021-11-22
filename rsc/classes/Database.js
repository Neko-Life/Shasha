'use strict';

const { Db, Collection } = require("mongodb");
const { logDev } = require("../debug");

const ENUM_SHADOCS = {
    schedules: 1,
    activeMessageInteractions: 2,
    document: 3,
    commandDisabled: 4,
    bannedGuilds: 5,
    bannedUsers: 6,
    infractions: 7,
    interactions: 8,
    recentAutocomplete: 9,
    muted: 10,
    muteSettings: 11
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
    "{Id}": 9
};

const ENUM_SHACOLTYPES = {
    "user/": 1,
    "guild/": 2,
    "member/": 3,
    "channel/": 4
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
        const cursor = this.col.find(find);
        let i = 0;
        let arr = await cursor.toArray();
        if (find[doc])
            arr = arr.filter(r => r[doc]);
        const map = new Map(arr.map(r => [r[doc] || i++, r]));
        return map;
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
    async set(doc, query, val = { noData: true }, push) {
        logDev("set", this.col.collectionName, doc, query, val, push);
        if (typeof val !== 'object') throw new TypeError("val must be a type of object. Got " + typeof val);
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
        if (typeof query !== "string") throw new TypeError("query must be a type of string. Got " + typeof query);
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