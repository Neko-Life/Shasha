'use strict';

const art = require("ascii-art");
const { workerData, parentPort } = require("worker_threads");
const { ASCII_IGNORE_HASH } = require("../constants");
const { logDev } = require("../debug");

if (workerData?.dev) process.dev = true;

async function run() {
    const { text, method, font } = workerData;
    logDev(workerData);
    const res = await art[method](text, font);
    logDev(res);
    const sec = res.replace(/\r/g, "");
    logDev(sec);
    const post = ASCII_IGNORE_HASH.includes(font)
        ? sec
        : sec.replace(/#?#/g, " ");
    logDev(post);
    parentPort.postMessage(post);
}

run().then(process.exit);