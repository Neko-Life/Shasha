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
let jobManager,
    jobs = [];

async function createSchedule(client, { guildID, userID, type, until }) {
    if (!client || !guildID || !userID || !type || !until) throw new TypeError("Undefined params!");
    const CHK = new Date().valueOf();
    if (!jobManager) await init(client);
    if (typeof until === "string") until = new Date(until);
    const NAME = [guildID, userID, type].join("/"),
        SC = {
            name: NAME,
            path: join(__dirname, "./execSc.js"),

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
        if ((until.valueOf() - CHK) < new Date(24 * 60 * 60 * 1000)) {
            jobManager.add(SC);
            jobs.push(SC);
            jobManager.start(NAME);
            if (until.valueOf() < CHK) {
                console.log("RUNNING IMMEDIATELY");
                jobManager.run(NAME);
            }
        }
        await col.updateOne({ document: NAME }, { $set: SC, $setOnInsert: { document: NAME } }, { upsert: true });
        return console.log("SCHEDULE " + NAME + " CREATED");
    } catch (e) {
        return errLog(e, null, client);
    }
}

async function init(client) {
    await jobLoad();

    jobManager = scheduler(client, jobs);
    module.exports.jobManager = jobManager;

    console.log("SCHEDULER INITIALIZED");
    return jobStart();
}

async function reset() {
    await jobManager.stop().catch(console.error);
    for (const job of jobs) {
        await jobManager.remove(job.name).catch(console.error);
    }

    await jobLoad();
    jobManager.add(jobs);
    console.log("JOBS REFRESHED");
    return jobStart();
}

async function jobLoad() {
    const CHK = new Date().valueOf();
    const CHK2 = new Date(24 * 60 * 60 * 1000).valueOf();
    jobs = (await col.find({}).toArray()).filter((v) => (v.date.valueOf() - CHK) < CHK2);

    const rstjb = new Date((23 * 60 * 60 * 1000) + (30 * 60 * 1000)).valueOf();
    const rsttm = {
        name: "REFRESH JOBS",
        path: join(__dirname, "./execSc.js"),
        worker: {
            argv: ["REFRESH JOBS"]
        },
        timeout: rstjb
    };
    jobs.push(rsttm);
    console.log((jobs.length - 1) + " JOBS LOADED");
    return 0;
}

function jobStart() {
    const CHK = new Date().valueOf();
    jobManager.start();
    jobs.forEach((v) => {
        if (v.date?.valueOf() < CHK) jobManager.run(v.name);
    });
    console.log("SCHEDULER STARTED");
    return 0;
}

module.exports = { createSchedule, init, reset }