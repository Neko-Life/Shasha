"use strict";

const { dropDeletedMessageCollection } = require("../database");

async function handle(client, ...msgs) {
    for (let i = 0; i < msgs.length; i++) {
        Object.defineProperty(msgs[i], "deleted", {
            value: true,
            enumerable: true,
            configurable: true,
        });
    }
    msgs.forEach(r => dropDeletedMessageCollection(client, r));
}

module.exports = { handle }