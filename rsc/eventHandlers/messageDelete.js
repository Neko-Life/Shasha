"use strict";

const { Collection } = require("discord.js");
const { dropDeletedMessageCollection } = require("../database");
const messageLinkPreview = require("../handlers/messageLinkPreview");

/**
 * 
 * @param {*} client 
 * @param {import("../typins").ShaMessage} msg 
 */
function handle(client, msg) {
    Object.defineProperty(msg, "deleted", {
        value: true,
        enumerable: true,
        configurable: true,
    });
    if (!msg.channel.deletedMessages) msg.channel.deletedMessages = new Collection();
    msg.channel.deletedMessages.set(msg.id, msg);
    if (msg.channel.deletedMessages.size > 20)
        msg.channel.deletedMessages.delete(msg.channel.deletedMessages.firstKey());
    messageLinkPreview(msg);
    dropDeletedMessageCollection(client, msg);
}

module.exports = { handle }
