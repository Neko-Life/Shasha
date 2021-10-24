'use strict';

const { logDev } = require("../debug");

/**
 * @typedef {"activeSelectMenus"|"document"|"commandDisabled"|"commandBanned"} ShaDbDocument
 * @typedef {"String"|"Object"|"Number"|"Boolean"|"{Id}"} ShaDbQuery
 * @typedef {"user/"|"guild/"|"member/"|"channel/"} ShaDbCollectionType - Types with "/" followed by Id
 */

class ShaBaseDb {
    /**
     * @param {import("mongodb/lib/db")} Db
     * @param {ShaDbCollectionType} collection
     */
    constructor(Db, collection) {
        /**
         * @type {import("mongodb/lib/db")}
         */
        this.db = Db;
        /**
         * @type {import("mongodb/lib/collection")}
         */
        this.collection = Db.collection(collection);
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
        logDev("get", doc, query);
        const cursor = this.collection.find(find);
        let i = 0;
        const map = new Map((await cursor.toArray()).map(r => [r[doc] || i++, r]));
        cursor.close(null, logDev);
        return map;
    }

    /**
     *
     * @param {ShaDbDocument} doc
     * @param {ShaDbQuery} query
     * @returns {Promise<object>}
     */
    async getOne(doc, query) {
        return this.collection.findOne({ [doc]: query });
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
        return this.collection.updateOne({ [doc]: query },
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
        return this.collection.deleteOne({ [doc]: query });
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