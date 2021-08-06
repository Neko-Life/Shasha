'use strict';

const commando = require("@iceprod/discord.js-commando");
const { Message } = require("discord.js");
const { Interval } = require("luxon");
const { trySend } = require("../../resources/functions");
const { intervalToDuration } = require("./src/duration");

module.exports = class slowmode extends commando.Command {
    constructor(client) {
        super(client, {
            name: "slowmode",
            memberName: "slowmode",
            group: "moderation",
            description: "Set slowmode of a channel.",
            guildOnly: true
        });
    }
    /**
     * 
     * @param {Message} msg 
     * @param {*} arg 
     * @returns 
     */
    run(msg, arg) {
        // if (!arg) return trySend(msg.client, msg, `There is ${intervalToDuration(Interval.after(new Date(), msg.channel.slo))}`)
    }
};