'use strict';

const { Db, Collection } = require("mongodb");
const { logDev } = require("../debug");

/**
 * @typedef {"activeSelectMenus"|"document"|"commandDisabled"|"bannedGuilds"|"bannedUsers"|"infractions"|"interactions"|"recentAutocomplete"} ShaDbDocument
 * @typedef {"String"|"Object"|"Number"|"Boolean"|"String[]"|"Object[]"|"Number[]"|"Boolean[]"|"{Id}"} ShaDbQuery
 * @typedef {"user/"|"guild/"|"member/"|"channel/"} ShaDbCollectionType - Types with "/" followed by Id
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
        logDev("get", this.col.collectionName, doc, query);
        const cursor = this.col.find(find);
        let i = 0;
        const map = new Map((await cursor.toArray()).map(r => [r[doc] || i++, r]));
        return map;
    }

    /**
     *
     * @param {ShaDbDocument} doc
     * @param {ShaDbQuery} query
     * @returns {Promise<object>}
     */
    async getOne(doc, query) {
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