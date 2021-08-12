'use strict';

const commando = require("@iceprod/discord.js-commando");
const { Message, User } = require("discord.js");
const { DateTime } = require("luxon");
const { parseDoubleDash, trySend, errLog, defaultEventLogEmbed, defaultDateFormat, parseComa } = require("../../resources/functions");
const createInfraction = require("./src/createInfraction");
const { duration, CHECK_FOR_DURATION_REGEXP } = require("./src/duration");
const targetUser = require("./src/targetUser");

module.exports = class ban extends commando.Command {
    constructor(client) {
        super(client, {
            name: "ban",
            memberName: "ban",
            group: "moderation",
            description: "Ban pesky troll and toxic members",
            guildOnly: true
        });
    }

    /**
     * @param {Message} msg 
     * @param {*} arg 
     * @returns 
     */
    async run(msg, arg) {
        const CL = msg.guild.member(msg.client.user);
        if (!(msg.member.isAdmin || msg.member.hasPermission("BAN_MEMBER"))) return trySend(msg.client, msg, "bruh moment <:nekokekLife:852865942530949160>");
        if (!(CL.isAdmin || CL.hasPermission("BAN_MEMBER"))) return trySend(msg.client, msg, "I don't have the power to do that <:pepewhysobLife:853237646666891274>");
        if (!arg) return trySend(msg.client, msg,
            "Args: `user_[name|mention|ID] -- [reason] -- [duration] [--d [number of days to delete messages of the user to ban]]`. Separate `user` with `,`. Example:" +
            `\`\`\`js\n${msg.guild.commandPrefix + this.name
            } 301859887724363796, Your father, #2341, @Ren Nakamura -- 10d76y8m99mo6h70w -- sending unsolicited cakes in DM --d 5\`\`\``);
        if (!msg.guild.DB) await msg.guild.dbLoad();
        const args = parseDoubleDash(arg),
            target = parseComa(args?.shift());
        let reason = "No reason provided", pDuration = {}, execTarget = [], resultMsg = "", daysToDeleteMessages = 0;
        const ET = await targetUser(msg, target);
        execTarget = ET.targetUser;
        resultMsg = ET.resultMsg;

        if (args?.[1]) {
            for (const ARG of args) {
                if (ARG === "--" || ARG.trim().length < 1) continue;
                if (ARG.startsWith("d ")) {
                    const U = ARG.slice(2).trim();
                    if (U.length && !/\D/.test(U)) daysToDeleteMessages = parseInt(U, 10); else return trySend(msg.client,
                        msg, "Invalid number of days to delete messages!");
                    continue;
                }
                else if (CHECK_FOR_DURATION_REGEXP.test(ARG.trim()))
                    pDuration = duration(msg.editedAt || msg.createdAt, ARG.trim()); else reason = ARG.trim();
            }
        }

        if (!pDuration.invoked) pDuration.invoked = DateTime.fromJSDate(msg.editedAt || msg.createdAt);
        if (!execTarget?.length) if (!resultMsg.length) return; else return trySend(msg.client, msg, resultMsg);

        /**
         * @type {User}
         */
        for (const U of execTarget) {
            const INFRACTION = createInfraction(msg, execTarget, "ban", reason),
                data = {
                    duration: pDuration,
                    infraction: INFRACTION.infraction,
                    moderator: msg.member
                };
            let banned = [], already = [], cant = [];
            try {
                await U.ban(msg.guild, data, { days: daysToDeleteMessages, reason: reason });
                banned.push(U.id);
            } catch (e) {
                if (/Missing Permissions|someone with higher position/.test(e.message)) cant.push(U.id);
            }

            INFRACTION.executed = banned;
            INFRACTION.aborted = already;
            INFRACTION.failed = cant;


            const emb = defaultEventLogEmbed(msg.guild)
                .setTitle("Infraction #" + INFRACTION.infraction)
                .setDescription(reason);

            if (banned.length) {
                let bannedStr = "", bannedArr = [];
                await msg.guild.addInfraction(INFRACTION);
                for (const U of banned) {
                    const tU = "<@" + U + ">, ";
                    if ((bannedStr + tU).length < 1000) bannedStr += tU; else bannedArr.push(U);
                }
                bannedStr = bannedStr.slice(0, -2);

                if (bannedArr.length) bannedStr += ` and ${bannedArr.length} more...`;
                if (already.length) emb.addField("Already banned", "<@" + already.join(">, <@") +
                    ">\n\nDuration updated for these users");

                emb.addField("Banned", bannedStr || "`[NONE]`")
                    .addField("At", defaultDateFormat(pDuration.invoked), true)
                    .addField("Until", pDuration.until ? defaultDateFormat(pDuration.until) : "Never", true)
            }
            emb.addField("For", pDuration.duration?.strings.join(" ") || "Indefinite");

            if (cant.length) emb.addField("Can't ban", "<@" + cant.join(">, <@") +
                ">\n\n**You can't ban someone with the same or higher position than you <:nekokekLife:852865942530949160>**");

            return trySend(msg.client, msg, { content: resultMsg, embed: emb });
        }
        return trySend(msg.client, msg, resultMsg);
    }
}