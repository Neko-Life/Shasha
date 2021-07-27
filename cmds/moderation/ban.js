'use strict';

const commando = require("@iceprod/discord.js-commando");
const { Message } = require("discord.js");
const { DateTime } = require("luxon");
const { parseDoubleDash, trySend } = require("../../resources/functions");
const { duration, CHECK_FOR_DURATION_REGEXP } = require("./src/duration");
const targetUser = require("./src/targetUser");

module.exports = class ban extends commando.Command {
    constructor(client) {
        super(client, {
            name: "ban",
            memberName: "ban",
            group: "moderation",
            description: "Ban pesky troll and toxic members",
            guildOnly: true,
            userPermissions: ["BAN_MEMBERS"],
            clientPermissions: ["BAN_MEMBERS"],
            details: "Args: `user_[name|mention|ID] -- [reason] -- [duration] [--d [number of days to delete messages of the user to ban]]`",
            examples: ["some user name, some user tag -- 10d76y8m99mo6h70w -- sending unsolicited cakes in DM --d 5"]
        });
    }

    /**
     * @param {Message} msg 
     * @param {*} arg 
     * @returns 
     */
    async run(msg, arg) {
        const args = parseDoubleDash(arg),
            target = args?.shift();
        let reason = "No reason provided", pDuration = {}, execTarget = [], resultMsg = "", daysToDeleteMessages = 0;

        if (!target || target.length < 1) return trySend(msg.client, msg, this.description); else {
            const ET = await targetUser(msg, target);
            execTarget = ET.targetUser;
            resultMsg = ET.resultMsg;
        }

        if (args?.[1]) {
            for (const ARG of args) {
                if (ARG === "--" || ARG.trim().length < 1) continue;
                if (ARG.startsWith("d ")) {
                    const U = ARG.slice(2).trim();
                    if (U.length > 0 && !/\D/.test(U)) daysToDeleteMessages = parseInt(U, 10); else return trySend(msg.client, msg, "Invalid number of days to delete messages!");
                    continue;
                }
                else if (CHECK_FOR_DURATION_REGEXP.test(ARG.trim()))
                    pDuration = duration(msg.editedAt || msg.createdAt, ARG.trim()); else reason = ARG.trim();
            }
        }

        if (!pDuration.invoked) pDuration.invoked = DateTime.fromJSDate(msg.editedAt || msg.createdAt);

        if (execTarget.length > 0) {
            for (const U of execTarget) {

            }
        }
    }
}