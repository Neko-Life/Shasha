'use strict';

// const { BaseDBManager } = require("../classes/Structures");
const AFKCmd = require("../cmds/fun/afk");

async function handle(client, msg) {
    // await BaseDBManager.initAllDBManager(msg);
    new AFKCmd().pinged(msg);
    new AFKCmd().unAfk(msg);
}

module.exports = { handle }