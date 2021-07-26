'use strict';

const commando = require("@iceprod/discord.js-commando"),
    { exec } = require("child_process"),
    { errLog, trySend } = require("../../resources/functions");

module.exports = class update extends commando.Command {
    constructor(client) {
        super(client, {
            name: "update",
            memberName: "update",
            group: "owner",
            description: "Update Shasha.",
            ownerOnly: true,
            guarded: true
        });
    }
    async run(msg) {
        exec("bash .update.sh", async (xe, o, e) => {
            if (xe || e) {
                await errLog(xe || e, msg, msg.client, true, "", true);
            }
            if (o) return trySend(msg.client, msg, o);
            return trySend("Done");
        });
    }
};