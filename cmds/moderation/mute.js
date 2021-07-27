'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend, findMemberRegEx, cleanMentionID, findChannelRegEx, findRoleRegEx, defaultImageEmbed, parseDoubleDash, parseComa, getRole, defaultEventLogEmbed, defaultDateFormat } = require("../../resources/functions");
const { database } = require("../../database/mongo");
const col = database.collection("Guild");
const schedule = database.collection("Schedule");
const { scheduler } = require("../../resources/scheduler");
const { DateTime, Settings, Interval } = require("luxon");
const muteSetting = require("./src/muteSetting");
const fn = require("./src/duration");
const durationFn = fn.duration;
const targetUser = require("./src/targetUser");
const configureMuteRole = require("./src/configureMuteRole");
const { makeJSONMessage } = require("../../resources/debug");
const createInfraction = require("./src/createInfraction");
Settings.defaultZone = "utc";

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
            details: `Run \`${client.commandPrefix}mute --s -r role_[name|ID|mention] -d [duration]\` to set up a mute role.\n` +
                `Or if you're too lazy you can run \`${client.commandPrefix}mute --cmr -n [name] -c color_[name|hex|number]\` to make a new mute role and let me set it up for you. ` +
                `You can view server as the newly created mute role and override my default settings later.\n` +
                `Example:\`\`\`\n--s -r muted -d 69y420mo36w49d69h4m420s\n` +
                `--s -r none -d 0\n--cmr -n Muted -c black\`\`\``,
            guildOnly: true,
            userPermissions: ['MANAGE_ROLES'],
            clientPermissions: ['MANAGE_ROLES']
        });
    }
    /**
     * @param {commando.CommandoMessage} msg 
     * @param {*} arg 
     * @returns 
     */
    async run(msg, arg) {
        msg.channel.startTyping();
        if (!msg.guild.DB) await msg.guild.dbLoad();
        const MOD = msg.guild.DB.settings,
            MUTE = MOD.mute || {},
            args = parseDoubleDash(arg),
            mentions = parseComa(args?.shift());

        if (!MOD.mute) msg.guild.DB.settings.mute = {};
        let reason = "No reason provided", duration = {}, resultMsg = "", targetUsers = [];

        if (args?.[1]) {
            for (const ARG of args) {
                if (ARG === "--" || ARG.trim().length < 1) continue;
                const U = ARG.slice(2).trim();
                if (/^cmr(\s|$)/.test(ARG)) return configureMuteRole(msg, ARG.slice(3).trim());
                if (/^s(\s|$)/.test(ARG)) return muteSetting(msg, U);
                if (fn.CHECK_FOR_DURATION_REGEXP.test(ARG.trim())) {
                    duration = durationFn(msg.editedAt || msg.createdAt, ARG.trim());
                } else reason = ARG.trim();
            }
        } else if (!MUTE.role || !msg.guild.roles.cache.get(MUTE.role)) {
            return trySend(this.client, msg, `No mute role configured!\n\n**[ADMINISTRATOR]**\nRun \`${msg.guild.commandPrefix + this.name} --s -r role_[name|ID|mention] -d [duration]\` to set it up.\n` +
                `Or if you're too lazy you can run \`${msg.guild.commandPrefix + this.name} --cmr -n [name] -c color_[name|hex|number]\` to make a new mute role and let me set it up for you. ` +
                `You can view server as the new mute role and override my default settings later.\n` +
                `Example:\`\`\`\n--s -r muted -d 69y420mo36w49d69h4m420s\n` +
                `--s -r none -d 0\n--cmr -n Muted -c black\`\`\``);
        }

        if (!duration.invoked) duration.invoked = DateTime.fromJSDate(msg.editedAt || msg.createdAt);
        if (!duration.until && MUTE.defaultDuration?.duration) duration.until = duration.invoked.plus(MUTE.defaultDuration.duration.object);
        if (duration.until?.invalid) duration.until = undefined; else if (duration.until && !duration.duration) {
            duration.interval = Interval.fromDateTimes(duration.invoked, duration.until);
            duration.duration = fn.intervalToDuration(duration.interval);
        }

        if (mentions?.length > 0) {
            const FR = await targetUser(msg, mentions, targetUsers, resultMsg);
            targetUsers = FR.targetUser;
            resultMsg = FR.resultMsg;
        } else return trySend(this.client, msg, "Args: `<[user_[mention|ID|name]]> -- [reason] -- [duration]`. Use `,` to provide multiple user. `--s` to view settings.\nExample:```js\n" + `${msg.guild.commandPrefix + this.name} 580703409934696449, @Shasha#1234, ur mom,#6969,^yuck\\s(ur)?\\s.{5}#\\d+69$--69y69mo69w420d420h420m420s -- Saying "joe"\`\`\``);

        if (targetUsers.length > 0) {
            let muted = [], cant = [], already = [], infractionN = [],
                infractionToDoc = createInfraction(msg, targetUsers, "mute", reason);

            for (const EXEC of targetUsers) {
                try {
                    const RES = await EXEC.mute(msg.guild, { duration: duration, infraction: infractionToDoc.infraction, moderator: msg.member }, reason);
                    if (RES.infraction) infractionN.push(RES.infraction);
                    muted.push(EXEC.id);
                } catch (e) {
                    if (/Missing Permissions|someone with higher position/.test(e.message)) cant.push(EXEC.id);
                    else if (/already muted/.test(e.message)) already.push(EXEC.id); else console.log(e); continue;
                }
            }

            infractionToDoc.executed = muted;
            infractionToDoc.aborted = already;
            infractionToDoc.failed = cant;

            if (muted.length > 0) await msg.guild.addInfraction(infractionToDoc);

            const emb = defaultEventLogEmbed(msg.guild);
            let mutedStr = "", mutedArr = [];

            if (muted.length > 0) for (const U of muted) {
                const tU = "<@" + U + ">, ";
                if ((mutedStr + tU).length < 1000) mutedStr += tU; else mutedArr.push(U);
            }

            if (mutedArr.length > 0) mutedStr += `and ${mutedArr.length} more...`;
            if (already.length > 0) emb.addField("Already muted", "<@" + already.join(">, <@") + ">\n\nDuration updated for these users");

            emb.setTitle("Infraction #" + infractionToDoc.infraction)
                .setDescription("**Reason**\n" + reason)
                .addField("Muted", mutedStr || "`[NONE]`")
                .addField("At", defaultDateFormat(duration.invoked), true)
                .addField("Until", duration.until ? defaultDateFormat(duration.until) : "Never", true)
                .addField("For", duration.duration?.strings.join(" ") || "Indefinite");

            if (cant.length > 0) emb.addField("Can't mute", "<@" + cant.join(">, <@") + ">\n\n**You can't mute someone with higher position than you <:nekokekLife:852865942530949160>**");

            return trySend(msg.client, msg, { content: resultMsg, embed: emb });
        }
        return trySend(msg.client, msg, resultMsg);
        resultMsg += `Result:\`\`\`js\nUsers: ${targetUsers.map(r => r?.tag).join(", ")}\nReason: ${reason}\nAt: ${duration.invoked.toFormat("DDD',' cccc',' tt")}\nFor: ${duration.duration?.strings?.join(" ")}\nUntil: ${duration.until?.toFormat("DDD',' cccc',' tt")}\`\`\``;
        return trySend(this.client, msg, { content: resultMsg + "```js\n" + JSON.stringify(infractionToDoc, null, 2) + "```", split: { maxLength: 2000, append: ",```", prepend: "```js\n", char: "," } });
    }
};