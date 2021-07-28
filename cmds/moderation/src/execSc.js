'use strict';

const { parentPort } = require("worker_threads");

if (parentPort) {
    const NAME = process.argv[2]?.split(/\//);
    parentPort.postMessage(NAME);
};