'use strict';

const { Collection } = require("discord.js");
const messageLinkPreview = require("../handlers/messageLinkPreview");

/**
 * 
 * @param {*} client 
 * @param {import("../typins").ShaMessage} msg 
 */
function handle(client, msg) {
    if (!msg.channel.deletedMessages) msg.channel.deletedMessages = new Collection();
    msg.channel.deletedMessages.set(msg.id, msg);
    if (msg.channel.deletedMessages.size > 20)
        msg.channel.deletedMessages.delete(msg.channel.deletedMessages.firstKey());
    messageLinkPreview(msg);
}

module.exports = { handle }