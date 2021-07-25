'use strict';

const Bree = require("bree");
const cabin = require("cabin");
const { Client } = require("discord.js");
const { errLog, trySend } = require("./functions"),
    { schedulerLog } = require("../config.json");

/**
 * @param {Client} client
 * @param {object[]} jobs
 * @returns {Bree}
 */
module.exports = (client, jobs = []) => {
    return new Bree({
        // logger: new cabin(),
        root: false,
        jobs: jobs,
        workerMessageHandler: (a) => trySend(client, schedulerLog, a),
        errorHandler: (e, m) => errLog(e, null, client, false, `\`${m?.threadId}\` \`${m?.name}\``)
    });
}