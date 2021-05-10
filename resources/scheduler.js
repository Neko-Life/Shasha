'use strict';

const bree = require("bree");
const cabin = require("cabin");

module.exports.scheduler = new bree({
    // logger: new cabin(),
    root: false,
    workerMessageHandler: () => console.log,
    errorHandler: () => console.error
});