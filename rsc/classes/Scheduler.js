'use strict';

const Bree = require("bree");
const { Guild } = require("discord.js");
// const cabin = require("cabin");
const { loadDb } = require("../database");
const { logDev } = require("../debug");
const { Actions } = require("./Actions");
const ShaClient = require("./ShaClient");
const ENUM_WORKER_ACTION = {
    ban: 1,
    mute: 2,
    set_name: 3,
    set_nickname: 4,
    add_role: 5,
    remove_role: 6,
    kick: 7,
    unmute: 8
};
const ENUM_WORKER_TARGET_TYPES = {
    channel: 1,
    member: 2,
    user: 3
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
         * @type {Actions}
         */
        this.actions = new Actions(client);
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
        logDev("Scheduler online. Loaded " + jobs.length + " schedules from " + client.guilds.cache.size + " guilds");
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
        this.actions[data.action](data);
    }

    /**
     * 
     * @param {ShaClient} client 
     * @param {Guild} guild
     * @returns {Promise<SchedulerJob[]>}
     */
    static async loadSchedules(client, guild) {
        logDev("Loading schedules", guild?.name);
        const schedules = [];
        if (!guild) {
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
            if (!(guild instanceof Guild)) throw new TypeError("guild isn't typeof Guild");
            const gd = loadDb(guild, "guild/" + guild.id);
            const db = await gd.db.getOne("schedules", "Object[]");
            if (db?.value?.length) {
                logDev("Found schedules", db);
                schedules.push(...db.value);
            }
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

    async remove(name) {
        logDev("[ SCHEDULER remove ]", name);
        const tD = this.jobs.findIndex(r => r.name === name);
        if (tD < 0) throw new RangeError("No job with the name " + name);
        const J = this.jobs.splice(tD, 1);
        if (J[0].worker?.workerData?.guild) {
            const guild = this.client.guilds.cache.get(J[0].worker.workerData.guild);
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
        const tD = this.jobs.findIndex(r => r.name === job.name);
        if (tD >= 0) {
            this.jobs.splice(tD, 1, job);
            try {
                await this.scheduler.stop(job.name);
                await this.scheduler.remove(job.name);
            } catch (e) { logDev(e) };
        } else this.jobs.push(job);
        try {
            this.scheduler.add(job);
        } catch (e) { logDev(e) };
        this.starts(job.name);
        logDev("[ SCHEDULER added ]", job);
    }
}

module.exports = { Scheduler }