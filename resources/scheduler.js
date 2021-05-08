'use strict';

const bree = require("bree");
const cabin = require("cabin");

module.exports.schedule = new bree({
    // logger: new cabin(),
    root: false,
    workerMessageHandler: () => console.log
});