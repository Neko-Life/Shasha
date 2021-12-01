'use strict';

// const { BaseDBManager } = require("../classes/Structures");
const AFKCmd = require("../cmds/fun/afk");
const messageLinkPreview = require("../handlers/messageLinkPreview");

async function handle(client, msg) {
    // await BaseDBManager.initAllDBManager(msg);
    new AFKCmd().pinged(msg);
    new AFKCmd().unAfk(msg);
    messageLinkPreview(msg);
}

module.exports = { handle }