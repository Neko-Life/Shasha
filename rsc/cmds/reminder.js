'use strict';

const { DateTime } = require("luxon");
const { Command } = require("../classes/Command");
const { Moderation } = require("../classes/Moderation");
const { LUXON_TIMEZONES } = require("../constants");
const { replyError } = require("../functions");
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
            }
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
            if (durationString.ms < 10000)
                return inter.reply(replyError({ message: "Duration less than 10000 ms" }));
            console;
        } catch (e) {
            return inter.reply(replyError(e));
        }
        await inter.deferReply();
        console;
    }
}