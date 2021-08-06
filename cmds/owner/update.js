'use strict';

const commando = require("@iceprod/discord.js-commando"),
    { exec } = require("child_process"),
    { trySend } = require("../../resources/functions");

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
        let ret = [];
        await exec("bash .update.sh", async (xe, o, e) => {
            for (const M of [xe, o, e])
                if (M)
                    ret.push(await trySend(msg.client, msg, M));
            ret.push(await trySend(msg.client, msg, "Done"));
        });
        return ret;
    }
};