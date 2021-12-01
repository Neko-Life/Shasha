'use strict';

const messageLinkPreview = require("../handlers/messageLinkPreview");

async function handle(client, msgOld, msgNew) {
    messageLinkPreview(msgNew);
}

module.exports = { handle }