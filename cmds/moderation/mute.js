'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend, findMemberRegEx, cleanMentionID, findChannelRegEx, findRoleRegEx, defaultImageEmbed } = require("../../resources/functions");
const { database } = require("../../database/mongo");
const col = database.collection("Guild");
const schedule = database.collection("Schedule");
const { scheduler } = require("../../resources/scheduler");

/*{
                footer: {
                    text: undefined,
                    icon: undefined
                },
                timestamp: false
            };
            {
                mute: {
                    role: undefined,
                    duration: {
                        date: undefined,
                        string: undefined
                    },
                    log: undefined,
                    publicLog: undefined
                },
                ban: {
                    duration: {
                        date: undefined,
                        string: undefined
                    },
                    log: undefined,
                    publicLog: undefined
                },
                kick: {
                    log: undefined,
                    publicLog: undefined
                }
            }
*/

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
        const doc = await col.findOne({document: msg.guild.id}),
        modDoc = doc?.["moderation"],
        muteSettingsDoc = modDoc?.["settings"]?.mute,
        defaultDurationDoc = muteSettingsDoc?.defaultDuration,
        infractionsDoc = modDoc?.infractions,
        args = arg.trim().split(/(?<!\\)(\-\-)+/),
        mentions = args.shift().split(/(?<!\\),+(?!\d*})/),
        durationRegExp = /\d+(?![^ymwdhs])[ymwdhs]?o?/gi,
        invokedAt = msg.createdAt,
        duration = {
            year: invokedAt.getFullYear(),
            month: invokedAt.getMonth(),
            date: invokedAt.getDate(),
            hour: invokedAt.getHours(),
            minute: invokedAt.getMinutes(),
            second: invokedAt.getSeconds()
        };
        let theSettingUp = {
            role: undefined,
            defaultDuration: {
                date: undefined,
                string: undefined
            },
            logChannel: undefined
        },
        durationHasSet = false,
        settingUp = false,
        settingRole = false,
        settingRoleHasSet = false,
        settingDuration = false,
        settingDurationHasSet = false,
        settingLogChannel = false,
        settingLogChannelHasSet = false,
        [timeForMessage, targetUser] = [["Indefinite"], []],
        reason = "No reason provided.",
        resultMsg = "";
        for (const argument of args) {
            const setArg = argument.toLowerCase().trim();
            if (/^settings?$/i.test(setArg)) {
                settingUp = true;
            }
            if (settingUp && /^durations?$/i.test(setArg)) {
                settingDuration = true;
            }
            if (settingUp && /^log$/i.test(setArg)) {
                settingLogChannel = true;
            }
            if (settingUp && /^role$/i.test(setArg)) {
                settingRole = true;
            }
            if (/^\d{1,16}(?![^ymwdhs])[ymwdhs]?o?/i.test(argument.trim()) && !durationHasSet) {
                const durationArg = argument.match(durationRegExp);
                for (const value of durationArg) {
                    const val = parseInt(value.match(/\d+/)[0], 10);
                    if (value.endsWith("h") || value.endsWith("ho")) {
                        duration.hour = duration.hour + val;
                    }
                    if (value.endsWith("y")) {
                        duration.year = duration.year + val;
                    }
                    if (value.endsWith("mo")) {
                        duration.month = duration.month + val;
                    }
                    if (value.endsWith("w")) {
                        duration.date = duration.date + 7 * val;
                    }
                    if (value.endsWith("d")) {
                        duration.date = duration.date + val;
                    }
                    if (value.endsWith("m") || !/\D/.test(value)) {
                        duration.minute = duration.minute + val;
                    }
                    if (value.endsWith("s")) {
                        duration.second = duration.second + val;
                    }
                }
                durationHasSet = true;
            } else {
                if (!settingRole && !settingLogChannel && argument.length > 0 && argument !== "--") {
                    reason = argument.trim();
                } else {
                    if (settingLogChannel && !settingLogChannelHasSet && argument.length > 0 && argument !== "--" && setArg !== "log") {
                        settingLogChannelHasSet = true;
                        const key = cleanMentionID(argument);
                        let logChannel;
                        if (/^\d{17,19}$/.test(key)) {
                            logChannel = msg.guild.channels.cache.get(argument);
                        } else {
                            const found = findChannelRegEx(msg, key);
                            logChannel = found[0];
                        }
                        if (/^none$/i.test(key)) {
                            logChannel = undefined;
                        }
                        if (logChannel || /^none$/i.test(key)) {
                            theSettingUp.logChannel = logChannel?.id;
                        } else {
                            resultMsg += `No channel found for: **${argument}**\n`;
                        }
                    }
                    if (settingRole && !settingRoleHasSet && argument.length > 0 && argument !== "--" && setArg !== "role") {
                        settingRoleHasSet = true;
                        const key = cleanMentionID(argument);
                        let role;
                        if (/^\d{17,19}$/.test(key)) {
                            role = msg.guild.roles.cache.get(argument);
                        } else {
                            const found = findRoleRegEx(msg, key);
                            role = found[0]?.id;
                        }
                        if (/^none$/i.test(key)) {
                            role = undefined;
                        }
                        if (role || /^none$/i.test(key)) {
                            theSettingUp.role = role;
                        } else {
                            resultMsg += `No role found for: **${argument}**\n`;
                        }
                    }
                }
            }
        }
        const roleConfCheck = msg.guild.roles.cache.get(muteSettingsDoc?.role);
        if (!roleConfCheck && !settingUp) {
            return trySend(this.clientPermissions, msg, `No mute role configured! Run \`${msg.guild.commandPrefix}${this.name} --settings <--role --<role_[name | ID]>> [--duration --<duration> | --log --<channel_[name | ID]>]\` to set it up.`);
        }
        let untilDate = new Date(String(duration.year), String(duration.month), String(duration.date), String(duration.hour), String(duration.minute), String(duration.second));
        if (untilDate.toString() === "Invalid Date") untilDate = "Indefinite";
        if (untilDate?.toUTCString() === invokedAt.toUTCString() && !settingDuration) {
            if (defaultDurationDoc?.date?.valueOf() > 0) {
                untilDate = new Date(invokedAt.valueOf() + defaultDurationDoc.date.valueOf() - 1000);
            } else {
                untilDate = "Indefinite";
            }
        }
        if (untilDate instanceof Date) {
            timeForMessage = [];
            const elapsedTime = new Date(untilDate.valueOf() - invokedAt.valueOf() + 1000),
            elapsed = [
                elapsedTime.getFullYear() - 1970,
                elapsedTime.getMonth(),
                elapsedTime.getDate() - 1,
                elapsedTime.getHours(),
                elapsedTime.getMinutes(),
                elapsedTime.getSeconds()
            ],
            elapsedName = [
                "year",
                "month",
                "day",
                "hour",
                "minute",
                "second"
            ];

            for (let index = 0; index < elapsed.length; index++) {
                if (elapsed[index] > 0) {
                    let mes = `${elapsed[index]} ${elapsedName[index]}`;
                    if (elapsed[index] > 1) {
                        mes += "s";
                    } else {}
                    timeForMessage.push(mes);
                } else {}
            }
            if (timeForMessage.length > 1) {
                timeForMessage[timeForMessage.length - 2] += " and";
            }
            if (settingDuration && !settingDurationHasSet && timeForMessage.length > 0) {
                settingDurationHasSet = true;
                theSettingUp.defaultDuration.date = elapsedTime,
                theSettingUp.defaultDuration.string = timeForMessage.join(" ");
            }
        }
        if (settingUp) {
            if(settingRoleHasSet) {
                await col.updateOne({document:msg.guild.id}, {$set:{"moderation.settings.mute.role":theSettingUp.role}}, {upsert:true}).catch(e => {return trySend(this.client, msg, "```js\n"+e.stack+"```")});
            }
            if (durationHasSet) {
                await col.updateOne({document:msg.guild.id}, {$set:{"moderation.settings.mute.defaultDuration":theSettingUp.defaultDuration}}, {upsert:true}).catch(e => {return trySend(this.client, msg, "```js\n"+e.stack+"```")});
            }
            if (settingLogChannelHasSet) {
                await col.updateOne({document:msg.guild.id}, {$set:{"moderation.settings.mute.logChannel":theSettingUp.logChannel}}, {upsert:true}).catch(e => {return trySend(this.client, msg, "```js\n"+e.stack+"```")});
            } 
            const doc = await col.findOne({document: msg.guild.id}),
            modDoc = doc?.["moderation"],
            muteSettingsDoc = modDoc?.["settings"]?.mute,
            defaultDurationDoc = muteSettingsDoc?.defaultDuration,
            logChannelDoc = muteSettingsDoc?.logChannel,
            roleDoc = muteSettingsDoc?.role;
            let settings = await defaultImageEmbed(msg);
            settings
            .setTitle("Mute Configuration")
            .addField("Role", roleDoc ? "<@&"+roleDoc+">" : "Not set")
            .addField("Duration", defaultDurationDoc?.string ?? "Not set")
            .addField("Log", logChannelDoc ? "<#"+logChannelDoc+">" : "Not set");
            return trySend(this.client, msg, {content:resultMsg, embed:settings});
        }
        for (const usermention of mentions) {
            if (usermention.length > 0) {
                let found = [],
                nameid = cleanMentionID(usermention);
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
            } else {
                if (!settingUp && mentions[0].length === 0) {
                    return trySend(this.client, msg, "Who do you wanna mute? Provide as first argument `<[RegExp | user_[mention | ID]]>`. Use `,` to provide more than one user. Use `--` to split arguments.\nExample:```js\n" + `${msg.guild.commandPrefix}${this.name} 832423842785623423, @Shasha#1234, retard wanna get muted, #6969, ^fuck (ur)? .{5}#\\d\\d69$--69y69mo69w420d420h420m420s--Saying "joe"\`\`\``);
                }
            }
        }
        let infractionToDoc;
        if (targetUser.length > 0) {
            let targetMember = [],
            notInServer = [];
            for (const user of targetUser) {
                const member = msg.guild.member(user);
                if (member) {
                    const pushIt = {
                        name:member.user.tag,
                        id:member.id,
                        roles:member.roles.cache.map(r => r.id)
                    }
                    targetMember.push(pushIt);
                } else {
                    const pushIt = {
                        name: user.tag,
                        id:user.id
                    }
                    notInServer.push(pushIt);
                }
            }
            const infractionCase = infractionsDoc?.map(r => r.infraction)?.length;
            infractionToDoc = {
                infraction: infractionCase ? infractionCase + 1 : 1,
                by: targetUser,
                moderator: msg.author,
                punishment: "mute",
                at: invokedAt,
                for: timeForMessage,
                until: untilDate,
                reason: reason,
                scene: msg.url,
                members: targetMember,
                users: notInServer
            }
            await col.updateOne({document: msg.guild.id}, { $push:{"moderation.infractions": infractionToDoc}}, {upsert:true});
            const newUnmuteSchedule = {
                name: "unmute",
                path: "./scheduler/unmute.js",
                worker: {
                    argv: [msg, infractionToDoc.infraction]
                },
                date: untilDate
            }
        }
        resultMsg += `Result:\`\`\`js\nUsers: ${targetUser.map(r => r?.tag).join(", ")}\nReason: ${reason}\nAt: ${invokedAt.toUTCString()}\nFor: ${timeForMessage.join(" ")}\nUntil: ${typeof untilDate !== "string" ? untilDate.toUTCString() : untilDate}\`\`\``;
        trySend(this.client, msg, {content:resultMsg+"```js\n" + JSON.stringify(infractionToDoc, null, 2) + "```",split:{maxLength:2000,append:",```",prepend:"```js\n",char:","}});
        return
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