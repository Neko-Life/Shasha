'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend, findMemberRegEx, cleanMentionID } = require("../../resources/functions");
const { database } = require("../../database/mongo");
const col = database.collection("Guild");
const dbExp = database.collection("Experiment");
const { scheduler } = require("../../resources/scheduler");

module.exports = class mute extends commando.Command {
    constructor(client) {
        super(client, {
            name: "mute",
            memberName: "mute",
            group: "moderation",
            description: "Mute.",
            guildOnly: true,
            userPermissions:['MANAGE_ROLES']
        });
    }
    /**
     * @param {commando.CommandoMessage} msg 
     * @param {*} arg 
     * @returns 
     */
    async run(msg, arg) {
        const doc = await col.findOne({document: msg.guild.id});
        const moderationDoc = doc?.["moderation"];
        const infractionDoc = moderationDoc?.infractions;
        const args = arg.trim().split(/(?<!\\)(\-\-)+/, 5);
        const mentions = args.shift().split(/(?<!\\),+/);
        const durationRegExp = /\d+(?![^ymwdhs])[ymwdhs]?o?/gi;
        const invokedAt = msg.createdAt;
        const duration = {
            year: invokedAt.getFullYear(),
            month: invokedAt.getMonth(),
            date: invokedAt.getDate(),
            hour: invokedAt.getHours(),
            minute: invokedAt.getMinutes(),
            second: invokedAt.getSeconds()
        }
        let durationHasSet = false, [timeForMessage, targetUser] = [["Indefinite"], []], reason = "No reason provided.", resultMsg = "";
        for (const argument of args) {
            if (/^\d+(?![^ymwdhs])[ymwdhs]?o?/i.test(argument.trim()) && !durationHasSet) {
                const durationArg = argument.match(durationRegExp);
                timeForMessage = [];
                for (const value of durationArg) {
                    const val = parseInt(value.match(/\d+/)[0], 10);
                    if (value.endsWith("h") || value.endsWith("ho")) {
                        duration.hour = duration.hour + val;
                        timeForMessage.push(val + " Hours");
                    }
                    if (value.endsWith("y")) {
                        duration.year = duration.year + val;
                        timeForMessage.push(val + " Years");
                    }
                    if (value.endsWith("mo")) {
                        duration.month = duration.month + val;
                        timeForMessage.push(val + " Months");
                    }
                    if (value.endsWith("w")) {
                        duration.date = duration.date + 7 * val;
                        timeForMessage.push(val + " Weeks");
                    }
                    if (value.endsWith("d")) {
                        duration.date = duration.date + val;
                        timeForMessage.push(val + " Days");
                    }
                    if (value.endsWith("m") || !/\D/.test(value)) {
                        duration.minute = duration.minute + val;
                        timeForMessage.push(val + " Minutes");
                    }
                    if (value.endsWith("s")) {
                        duration.second = duration.second + val;
                        timeForMessage.push(val + " Seconds");
                    }
                }
                durationHasSet = true;
            } else {
                if (argument.length > 0 && argument !== "--") {
                    reason = argument.trim();
                }
            }
        }
        let untilDate = new Date(String(duration.year), String(duration.month), String(duration.date), String(duration.hour), String(duration.minute), String(duration.second));
        if (untilDate.toUTCString() === invokedAt.toUTCString()) {
            untilDate = "Indefinite";
        }
        for (const usermention of mentions) {
            if (usermention.length > 0) {
                let found = [];
                let nameid = usermention.trim();
                nameid = cleanMentionID(nameid);
                if (/^\d{17,19}$/.test(nameid)) {
                    const findmem = msg.guild.member(nameid);
                    if (findmem) {
                        found.push(findmem.user);
                    } else {
                        await this.client.users.fetch(nameid).then(fetchUser => found.push(fetchUser)).catch(() => {});
                    }
                } else {
                    found = findMemberRegEx(msg, nameid).map(r => r.user);
                }
                if (found.length > 0 && found[0] !== null) {
                    const foundDupli = targetUser.findIndex(r => r === found[0]);
                    if (foundDupli !== -1) {
                        resultMsg += `**[WARNING]** Duplicate for user **${targetUser[foundDupli].tag}** with keyword: **${usermention.trim()}**\n`;
                    } else {
                        targetUser.push(found[0]);
                        if (found.length > 1) {
                            resultMsg += `**[WARNING]** Multiple users found for: **${usermention.trim()}**\n`;
                        }
                    }
                } else {
                    resultMsg += `Can't find user: **${usermention.trim()}**\n`;
                }
            }
        }
        let infractionToDoc;
        if (targetUser.length > 0) {
            infractionToDoc = {
                infraction: Math.max(infractionDoc?.map(r => r.infraction) + 1),
                by: targetUser,
                moderator: `**${msg.author.tag}** <@${msg.author.id}> (${msg.author.id})`,
                punishment: "Mute",
                at: invokedAt,
                for: timeForMessage,
                until: untilDate,
                reason: reason,
                scene: msg.url
            }
            const newUnmuteSchedule = {
                name: "unmute schedule " + targetUser?.id,
                path: "./scheduler/unmute.js",
                worker: {
                    argv: {

                    }
                }
            }
        }
        resultMsg += `Result:\`\`\`js\nUsers: ${targetUser.map(r => r?.tag).join(", ")}\nReason: ${reason}\nAt: ${invokedAt.toUTCString()}\nFor: ${timeForMessage === "Indefinite" ? timeForMessage : timeForMessage.join(" + ")}\nUntil: ${typeof untilDate !== "string" ? untilDate.toUTCString() : untilDate}\`\`\`\n`;
        trySend(this.client, msg, "```js\n" + JSON.stringify(infractionToDoc, null, 2) + "```");
        return trySend(this.client, msg, resultMsg);
    }
};

            /* if (config.mute.role.length === 0) {
                return msg.channel.send(`Mute role isn't set! Run \`${this.client.commandPrefix}mute --role <role_[mention, ID]>\`. If you insist i will just give them admin perms <:purifyLife:774102054046007298>`)
            }
            if (setArgs) {
                for(let set of setArgs) {
                    set = set.toLowerCase();
                    switch(set) {
                        case startsWith('role'): {
                            let role = set.slice('role'.length).trim();
                            if (role.startsWith('<&')) {
                                role = role.slice(2,-1);
                            }
                            //const foundRole = 
                        }
                    }
                }
            }*/
                    //scheduler.add()
                    /*const yearDate = dateDur.getFullYear();
                    const monthDate = dateDur.getMonth();
                    const dayDate = dateDur.getDay();
                    const hourDate = dateDur.getHours();
                    const minuteDate = dateDur.getMinutes();
                    const secondDate = dateDur.getSeconds();*/