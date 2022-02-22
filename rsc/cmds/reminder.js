"use strict";

const { DateTime } = require("luxon");
const { Command } = require("../classes/Command");
const { Moderation } = require("../classes/Moderation");
const { LUXON_TIMEZONES, SCHEDULE_MESSAGER_PATH } = require("../constants");
const { logDev } = require("../debug");
const { replyError, unixToSeconds } = require("../functions");
const { createInterval, intervalToStrings } = require("../util/Duration");

module.exports.remind = class RemindCmd extends Command {
    constructor(interaction) {
        const tz = {};
        for (const k of LUXON_TIMEZONES)
            tz[k] = k;
        super(interaction, {
            name: "remind",
            autocomplete: {
                commands: {
                    timezone: tz
                }
            },
            deleteSavedMessagesAfter: 10000,
        });
    }
    async run(inter, { about, at, timezone = { value: "utc" }, channel } = {}) {
        const startDate = new Date();
        const durArg = at.value.slice(2).trim();
        let endDate;
        let interval;
        let durationString;
        if (/^\d/.test(durArg)) {
            try {
                const parsed = Moderation.defaultParseDuration(startDate, durArg);
                endDate = parsed.end;
                interval = parsed.interval;
                durationString = parsed.duration;
            } catch (e) {
                return inter.reply(replyError(e));
            }
        } else try {
            endDate = DateTime.fromFormat(at.value, `DDD ${/(?:am|pm)$/i.test(at.value) ? "tt" : "TT"}`).setZone(timezone.value).toJSDate();
            interval = createInterval(startDate, endDate);
            durationString = intervalToStrings(interval);
        } catch (e) {
            return inter.reply(replyError(e));
        }
        if (interval.invalidReason === "end before start")
            return inter.reply("Aww someone wanna get nostalgic uwu so sweett but sorry i can't remind you at that time, the past has passed just move on already");
        if ((durationString.ms || 0) < 10000)
            return inter.reply(replyError({ message: "Duration less than minimum ms" }));

        if (!(endDate instanceof Date))
            throw new TypeError("endDate isn't Date: " + typeof endDate + " " + endDate.prototype?.name);

        await inter.deferReply();

        /**
         * 
         * @type {import("../classes/Actions").RemindActionData}
         */
        const data = {
            about: about.value,
            action: "remind",
            user: this.user.id,
        };
        if (channel)
            data.channel = channel.channel.id;

        const job = {
            name: `reminder/${this.user.id}/${startDate.valueOf()}`,
            path: SCHEDULE_MESSAGER_PATH,
            date: endDate,
            type: "reminder",
            worker: {
                workerData: data
            },
        }
        logDev(await this.client.scheduler.add(job));
        return this.saveMessages(inter.editReply(`Okie! I will remind you about it in ${durationString.strings.join()} at <t:${unixToSeconds(endDate)}:F>! You can manage all your reminder with \`/reminder manage\``));
    }
}

module.exports.manage = class ManageRemindCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "manage-reminder",
        });
    }
    async run(inter, { action }) { }
}