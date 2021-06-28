'use strict';

const commando = require("@iceprod/discord.js-commando");

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
    run(msg) {

    }
};