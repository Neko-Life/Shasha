'use strict';

const { join } = require("path");
const requireAll = require("require-all");

module.exports = (client) => {
    client.tCmds = requireAll({ dirname: join(__dirname, "tCmds") });
    delete client.tCmds.resources;
    process.stdin.on("data", stdinBuffer => {
        // console.log(stdinBuffer.toJSON().data[0]);
        const msg = stdinBuffer.toString().slice(0, -1).trim();
        if (!msg) return;
        const cmd = msg.split(" ", 1)[0];
        let ex;
        for (const c in client.tCmds) {
            if (!c) return console.log("No command exist");
            if (c === cmd || client.tCmds[c].aliases?.includes(cmd)) {
                ex = client.tCmds[c];
                break;
            }
        }
        if (!ex) return console.log("No command:", cmd); else return ex.run(client, msg.slice(cmd.length).trim());
    });
}