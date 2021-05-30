'use strict';

const commando = require("@iceprod/discord.js-commando");
const { ranLog, trySend } = require("../../resources/functions");
const conf = require('../../config.json');

module.exports = class invite extends commando.Command {
    constructor(client) {
        super(client, {
            name: "invite",
            memberName: "invite",
            group: "utility",
            description: "Give you spam.",
        });
    }
    run(msg) {
        return trySend(this.client, msg, "Mute me after cuz it's spam\n"+conf.invite);
    }
};