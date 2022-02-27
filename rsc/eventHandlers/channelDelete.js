"use strict";

const { loadDb } = require("../database");
const { logDev } = require("../debug");

async function handle(client, channel) {
    loadDb(channel, `channel/${channel.id}`);
    channel.db.col.drop().catch(logDev);
}

module.exports = { handle }
