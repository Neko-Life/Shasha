'use strict';

const { padEnd } = require("lodash");

module.exports = {
    description: "Show help",
    aliases: ["h"],
    run(client) {
        const h = [];
        for (const a in client.tCmds) {
            const r = client.tCmds[a];
            h.push(`${padEnd(a, 10, " ")}: ${r.description}`);
        }
        return console.log(h.join("\n"));
    }
}