'use strict';

const { timestampAt } = require("../debug");
let a;

module.exports = {
    description: "Toggle debug mode",
    aliases: ["d"],
    run(client) {
        if (!a) {
            client.addListener("debug", (...args) => {
                if (client.tDebug) console.log(...args, timestampAt());
            });
            a = true;
        }
        if (client.tDebug) {
            client.tDebug = false;
            return console.log("Debug disabled");
        }
        client.tDebug = true;
        return console.log("Debug enabled");
    }
}