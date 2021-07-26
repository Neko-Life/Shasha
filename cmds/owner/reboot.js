'use strict';

const commando = require("@iceprod/discord.js-commando"),
    { exec } = require("child_process"),
    { errLog, trySend } = require("../../resources/functions");

module.exports = class reboot extends commando.Command {
    constructor(client) {
        super(client, {
            name: "reboot",
            memberName: "reboot",
            group: "owner",
            description: "Reboot Shasha.",
            ownerOnly: true,
            guarded: true
        });
    }

    async run(msg) {
        await trySend(msg.client, msg, "Cyaa~");
        exec("pm2 restart --name shasha");
        process.exit();
    }
}