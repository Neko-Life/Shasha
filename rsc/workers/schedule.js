'use strict';

const { parentPort, workerData } = require("worker_threads");
const { logDev } = require("../debug");

if (workerData?.dev) process.dev = true;
logDev("[ WORKER schedule ]", workerData);

parentPort.postMessage(JSON.stringify(workerData));
process.exit();