'use strict';

const { ShaBaseDb } = require("./classes/Database");
const { logDev } = require("./debug");
const { database } = require("./mongo");

// ---------------- DATABASES ----------------
// Databases related functions

/**
 * @template T
 * @param {T} instance 
 * @param {import("./classes/Database").ShaDbCollectionType} collection 
 * @returns {T}
 */
function loadDb(instance, collection) {
    if (!instance) throw new TypeError("instance is undefined!");
    if (instance.db) return instance;
    if (!collection) throw new Error("collection isn't specified!");
    instance.db = new ShaBaseDb(database, collection);
    return instance;
}

/**
 * @typedef {object} AddUserExpOpt
 * @property {number} maxRandom - Max random value
 * @property {number} minRandom - Min random value
 * @property {"floor"|"ceil"} round - Round maxRandom result
 * @property {number} divide - Divide rounded maxRandom result
 * @property {number} add - Value to add
 * 
 * @param {import("./typins").ShaUser} user 
 * @param {AddUserExpOpt} opt
 * @returns 
 */
async function addUserExp(user, opt = {}) {
    loadDb(user, "user/" + user.id);
    const data = await user.db.getOne("exp", "Number");
    let exp = data?.value;
    if (!exp) exp = 0;
    if (typeof exp !== "number")
        throw new TypeError("exp isn't number. Somethin's wrong in your codes");
    let add;
    if (opt.maxRandom) {
        if (typeof opt.minRandom !== "number") opt.minRandom = 0;
        add = Math.random() * (opt.maxRandom - opt.minRandom) + opt.minRandom;
        if (["floor", "ceil"].includes(opt.round))
            add = Math[opt.round](add);
        if (opt.divide)
            add = add / opt.divide;
    }
    if (opt.add)
        exp += opt.add;
    if (typeof add !== "number") add = 0;
    exp += add;
    if (typeof exp !== "number") throw new TypeError("exp isn't a number");
    return user.db.set("exp", "Number", { value: exp });
}

async function dropDeletedMessageCollection(client, message) {
    if (message.author && message.author.id !== client.user.id) return;
    const col = database.collection(`message/${message.channelId}/${message.id}`);
    logDev(await col.drop().catch(() => { }));
}

module.exports = {
    loadDb,
    addUserExp,
    dropDeletedMessageCollection
}