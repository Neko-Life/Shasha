"use strict";

async function handle(client, data) {
    client.errorChannel?.send("`[RATE_LIMIT]` ```js\n" + JSON.stringify(data, null, 2) + "```");
};

module.exports = { handle }
