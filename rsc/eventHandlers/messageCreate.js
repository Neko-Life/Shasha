'use strict';

const { BaseDBManager } = require("../classes/Structures");
const AFKCmd = require("../cmds/fun/afk");

async function handle(client, msg) {
    // await BaseDBManager.initAllDBManager(msg);
    AFKCmd.pinged(msg);
    AFKCmd.unAfk(msg);
}

module.exports = { handle }