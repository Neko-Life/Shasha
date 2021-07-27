'use strict';

const Bree = require("bree");
const { errLog } = require("../../../resources/functions");

const { join } = require("path"),
    { scheduler } = require("../../../resources/scheduler"),
    { database } = require("../../../database/mongo"),
    col = database.collection("Schedule");

/**
 * @type {Bree}
 */
let jobManager;

async function createSchedule(client, { guildID, userID, type, until }) {
    if (!client || !guildID || !userID || !type || !until) throw new TypeError("Undefined params!");
    if (!jobManager) await init(client);
    let path;
    if (type === "mute") path = "./unmuteSc.js";
    else if (type === "ban") path = "./unbanSc.js";
    else throw new TypeError("Invalid type: " + type);
    if (typeof until === "string") until = new Date(until);
    const NAME = guildID + "/" + userID + "/" + type,
        SC = {
            name: NAME,
            path: join(__dirname, path),

            /**
             * @type {import("worker_threads").WorkerOptions}
             */
            worker: {
                argv: [NAME]
            },
            date: until
        };

    try {
        await jobManager.remove(NAME).catch(() => { });
        jobManager.add(SC);
        jobManager.start(NAME);
        return col.updateOne({ document: NAME }, { $set: SC, $setOnInsert: { document: NAME } }, { upsert: true });
    } catch (e) {
        return errLog(e, null, client);
    }
}

async function init(client) {
    const jobs = await col.find({}).toArray();
    console.log(jobs);
    jobManager = scheduler(client, jobs);
    jobManager.start();
}

module.exports = { createSchedule }