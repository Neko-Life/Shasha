"use strict";

const Bree = require("bree");
const { Guild } = require("discord.js");
// const cabin = require("cabin");
const { loadDb } = require("../database");
const { logDev } = require("../debug");
const { ShaBaseDb } = require("./Database");
const ShaClient = require("./ShaClient");

const ENUM_WORKER_ACTION = {
    ban: 1,
    mute: 2,
    set_name: 3,
    set_nickname: 4,
    add_role: 5,
    remove_role: 6,
    kick: 7,
    unmute: 8,
};

const ENUM_WORKER_TARGET_TYPES = {
    channel: 1,
    member: 2,
    user: 3,
};

const ENUM_SCHEDULES_TYPE = {
    "guild": 1,
    "reminder": 2,
}

/**
 * @typedef {object} SchedulerWorkerData
 * @property {string} guild - Guild Id
 * @property {string} target - Target Id
 * @property {keyof ENUM_WORKER_TARGET_TYPES} targetType - Target type
 * @property {keyof ENUM_WORKER_ACTION} action - Action to do to target
 * 
 * @typedef {object} SchedulerJob
 * @property {string} name - Job name
 * @property {string} path - Path to worker which signal the data
 * @property {Date} date - When to execute
 * @property {keyof ENUM_SCHEDULES_TYPE} type
 * @property {{workerData: SchedulerWorkerData}} worker - Worker data
 */

class Scheduler {
    /**
     * 
     * @param {ShaClient} client 
     * @param {SchedulerJob[]} jobs 
     */
    constructor(client, jobs = []) {
        /**
         * @type {ShaClient}
         */
        this.client = client;
        /**
         * @type {SchedulerJob[]}
         */
        this.jobs = jobs;
        /**
         * @type {Bree}
         */
        this.scheduler = this.init(jobs);
        this.starts();
        const b = new Date().valueOf();
        for (const k of jobs)
            if (k.date.valueOf() < b) {
                k.date = new Date(b + 10000);
                this.add(k);
            }
        logDev("Scheduler online. Loaded " + jobs.length + " schedules from " + client.guilds.cache.size + " guilds and reminder database");
    }

    /**
     * @param {SchedulerJob[]} jobs
     * @returns {Bree}
     */
    init(jobs = []) {
        return new Bree({
            // logger: new cabin,
            root: false,
            jobs: jobs,
            workerMessageHandler: ({ message }) => {
                this.handleMessage(message);
            },
            errorHandler: (e, m) => {
                e.stack = e.stack + "\nModule: Scheduler";
                process.emit("error", e);
            }
        });
    }

    handleMessage(message) {
        const data = JSON.parse(message);
        this.client.triggerActions[data.action](data);
    }

    /**
     * 
     * @param {ShaClient} client 
     * @param {keyof ENUM_SCHEDULES_TYPE} type
     * @param {*} instance
     * @returns {Promise<SchedulerJob[]>}
     */
    static async loadSchedules(client, type, instance) {
        logDev("Loading schedules", type, instance?.name);
        const schedules = [];
        if (type === "guild") {
            if (!instance) {
                for (const [id, guild] of client.guilds.cache) {
                    if (!guild.id) continue;
                    const gd = loadDb(guild, "guild/" + guild.id);
                    const db = await gd.db.getOne("schedules", "Object[]");
                    if (!db?.value?.length) continue;
                    else {
                        logDev("Found schedules", guild.name, db);
                        schedules.push(...db.value);
                    }
                }
            } else {
                if (!(instance instanceof Guild)) throw new TypeError("instance isn't Guild");
                const gd = loadDb(instance, "guild/" + instance.id);
                const db = await gd.db.getOne("schedules", "Object[]");
                if (db?.value?.length) {
                    logDev("Found schedules", db);
                    schedules.push(...db.value);
                }
            }
        } else if (type === "reminder") {
            const db = new ShaBaseDb(client.db.db, "reminder");
            const map = await db.get("reminder", String);
            const arr = new Array(...map).map(([k, v]) => v.value);
            schedules.push(...arr);
        }
        logDev(schedules);
        return schedules;
    }

    starts(name) {
        logDev("[ SCHEDULER starts ]", name);
        return this.scheduler.start(name);
    }

    async stop(name) {
        logDev("[ SCHEDULER stop ]", name);
        return this.scheduler.stop(name);
    }

    /**
     * 
     * @param {string} name
     * @returns 
     */
    async remove(name) {
        logDev("[ SCHEDULER remove ]", name);
        const tD = this.jobs.findIndex(r => r.name === name);
        if (tD < 0) throw new RangeError("No job with the name " + name);
        const J = this.jobs[tD]; // this.jobs.splice(tD, 1);
        if (J.type === "guild") {
            if (J.worker?.workerData?.guild) {
                const guild = this.client.guilds.cache.get(J.worker.workerData.guild);
                if (guild) {
                    const gd = loadDb(guild, "guild/" + guild.id);
                    const doc = await gd.db.getOne("schedules", "Object[]");
                    const xD = doc.value.findIndex(r => r.name === name);
                    if (xD >= 0) {
                        doc.value.splice(xD, 1);
                        logDev("Set guild schedules", guild.name, doc);
                        gd.db.set("schedules", "Object[]", { value: doc.value });
                    }
                }
            }
        } else if (J.type === "reminder") {
            const db = new ShaBaseDb(this.client.db.db, "reminder");
            logDev("Delete reminder", name);
            logDev(await db.delete("reminder", name));
        }
        await this.stop(name);
        logDev("[ SCHEDULER removed ]", name);
        return this.scheduler.remove(name);
    }

    /**
     * 
     * @param {SchedulerJob} job
     */
    async add(job) {
        logDev("[ SCHEDULER add ]", job);
        if (job.type === "guild") {
            if (job.worker?.workerData?.guild) {
                const guild = this.client.guilds.cache.get(job.worker.workerData.guild);
                if (guild) {
                    const nJob = { ...job };
                    if (typeof nJob.worker.workerData.dev === "boolean")
                        delete nJob.worker.workerData.dev;
                    const gd = loadDb(guild, "guild/" + guild.id);
                    const get = await gd.db.getOne("schedules", "Object[]");
                    const vals = get?.value || [];
                    const index = vals.findIndex(r => r.name === job.name);
                    if (index < 0) {
                        logDev("Push guild schedule", job);
                        gd.db.push("schedules", "Object[]", { value: nJob });
                    } else {
                        vals[index] = job;
                        logDev("Replace guild schedule", job);
                        gd.db.set("schedules", "Object[]", { value: vals });
                    }
                }
            }
        } else if (job.type === "reminder") {
            const db = new ShaBaseDb(this.client.db.db, "reminder");
            logDev("Set reminder", job);
            logDev(await db.set("reminder", job.name, { value: job }));
        }
        const tD = this.jobs.findIndex(r => r.name === job.name);
        if (tD >= 0) {
            this.jobs.splice(tD, 1, job);
            try {
                await this.scheduler.stop(job.name);
                await this.scheduler.remove(job.name);
            } catch (e) { logDev(e) };
        } // else this.jobs.push(job);
        try {
            this.scheduler.add(job);
        } catch (e) { logDev(e) };
        this.starts(job.name);
        logDev("[ SCHEDULER added ]", job);
    }
}

module.exports = { Scheduler }