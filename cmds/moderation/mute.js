'use strict';

const commando = require("@iceprod/discord.js-commando");
const { getUser, trySend, findMemberRegEx, cleanMentionID } = require("../../resources/functions");
const { database } = require("../../database/mongo");
const { muteDurationMultiplier } = require("../../resources/date");
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
        const modConf = doc?.["moderation"];
        const muteConf = modConf?.mute;
        const modCase = modConf?.case;
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
        let durationHasSet = false;
        let [timeForMessage, targetUser] = [["Indefinite"], []], reason = "No reason provided by " + msg.author.tag;
        for (const argument of args) {
            if (/^\d+(?![^ymwdhs])[ymwdhs]?o?/i.test(argument.trim()) && !durationHasSet) {
                const durationArg = argument.match(durationRegExp);
                console.log(durationArg);
                timeForMessage = [];
                for (const value of durationArg) {
                    console.log(value);
                    const val = parseInt(value.match(/\d+/)[0], 10);
                    console.log(val);
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
                    reason = msg.author.tag+": "+argument.trim();
                }
            }
        }
        for (const usermention of mentions) {
            if (usermention.length > 0) {
                let found = [];
                let nameid = usermention.trim();
                nameid = cleanMentionID(nameid);
                if (/\D/.test(nameid)) {
                    found = findMemberRegEx(msg, nameid);
                } else {
                    found.push(msg.guild.member(nameid));
                    if (found[0] === null) {
                        found = [];
                        found = findMemberRegEx(msg, nameid);
                    }
                }
                if (found.length > 0) {
                    targetUser.push(found[0].user.tag);
                } else {
                    trySend(this.client, msg, `Can't find user: **${usermention.trim()}**`);
                }
            }
            if (targetUser.length > 0) {
                const dateDur = new Date(msg.createdAt.valueOf() + duration).toUTCString();
                const newMuteSchedule = {
                    name: "unmute schedule " + targetUser.id,
                    path: "./scheduler/unmute.js",
                    worker: {
                        argv: [msg.guild.id, modCase?.length + 1 ?? 1, targetUser.id]
                    }
                }
            }
        }
        let testdate = new Date(String(duration.year), String(duration.month), String(duration.date), String(duration.hour), String(duration.minute), String(duration.second));
        if (testdate.toUTCString() === invokedAt.toUTCString()) {
            testdate = undefined;
        }
        return trySend(this.client, msg, `Result:\`\`\`js\nUsers: ${targetUser}\nReason: ${reason}\nFor: ${timeForMessage.join(" + ")}\nBegins: ${invokedAt.toUTCString()}\nEnds: ${testdate?.toUTCString()}\`\`\``);
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