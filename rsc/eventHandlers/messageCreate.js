'use strict';

// const { BaseDBManager } = require("../classes/Structures");
const AFKCmd = require("../cmds/fun/afk");
const { cacheGuildInvites } = require("../functions");
const messageLinkPreview = require("../handlers/messageLinkPreview");

async function handle(client, msg) {
    // await BaseDBManager.initAllDBManager(msg);
    new AFKCmd().pinged(msg);
    new AFKCmd().unAfk(msg);
    messageLinkPreview(msg);
    if (client.isOwner(msg.author))
        if (msg.content === "hiiii it's me shasha OwO UwU")
            msg.client.loadOwnerGuildCommand(msg.guild);
    if (msg.guild)
        cacheGuildInvites(msg.guild);
}

module.exports = { handle }