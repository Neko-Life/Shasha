'use strict';

const { DateTime, Settings, Interval, DurationObject } = require("luxon");
const DURATION_REGEXP = /[\-]?\d+(?![^ymwdhs])[ymwdhs]?o?/gi;
const DT_PRINT_FORMAT = "DDD'\n'cccc',' tt";
const CHECK_FOR_DURATION_REGEXP = /^[\-\+]?\d{1,16}(?![^ymwdhs])[ymwdhs]?o?/i;

Settings.defaultZone = "utc";

/**
 * 
 * @param {Interval} interval 
 * @returns {{ "object": DurationObject, strings: string[] }}
 */
function intervalToStrings(interval) {
    if (!(interval instanceof Interval)) return;

    const object = interval.toDuration(
        ["years", "months", "days", "hours", "minutes", "seconds"],
        { conversionAccuracy: "longterm" }
    ).toObject();

    const strings = [];
    for (const S in object) {
        object[S] = Math.floor(object[S]);
        if (object[S] <= 0) continue;
        strings.push(
            `${object[S]} ${object[S] === 1 ? S.slice(0, -1) : S}`
        );
    }
    if (strings.length > 0) {
        if (strings.length > 1) strings[strings.length - 2] += " and";
    } else strings[0] = "Not even 1 second";
    return { object, strings };
};

/**
 * @param {Date} base - Base date
 * @param {string} string - To match /[\-]?\d+(?![^ymwdhs])[ymwdhs]?o?/gi
 */
function parseDuration(base, string) {
    const DURATION = {
        year: base.getFullYear(),
        month: base.getMonth(),
        day: base.getDate(),
        hour: base.getHours(),
        minute: base.getMinutes(),
        second: base.getSeconds() + 1
    },
        DT_INVOKED = DateTime.fromJSDate(base),
        DURATION_ARGS = string.match(DURATION_REGEXP);

    let changed = false;
    if (DURATION_ARGS?.length)
        for (const value of DURATION_ARGS) {
            const val = parseInt(value.match(/[\-]?\d+/)[0], 10);
            if (!val) continue;
            if (value.endsWith("h") || value.endsWith("ho")) {
                DURATION.hour = DURATION.hour + val;
                changed = true;
                continue;
            }
            if (value.endsWith("y")) {
                DURATION.year = DURATION.year + val;
                changed = true;
                continue;
            }
            if (value.endsWith("mo")) {
                DURATION.month = DURATION.month + val;
                changed = true;
                continue;
            }
            if (value.endsWith("w")) {
                DURATION.day = DURATION.day + 7 * val;
                changed = true;
                continue;
            }
            if (value.endsWith("d")) {
                DURATION.day = DURATION.day + val;
                changed = true;
                continue;
            }
            if (value.endsWith("m") || !/[^\d\-\+]/.test(value)) {
                DURATION.minute = DURATION.minute + val;
                changed = true;
                continue;
            }
            if (value.endsWith("s")) {
                DURATION.second = DURATION.second + val;
                changed = true;
                continue;
            }
        }
    let DT_END, DT_INTERVAL;

    if (changed) {
        let date = new Date(
            DURATION.year,
            DURATION.month,
            DURATION.day,
            DURATION.hour,
            DURATION.minute,
            DURATION.second
        );
        if (date.toString() === "Invalid Date")
            date = new Date(8639900000000000);
        DT_END = DateTime.fromJSDate(date);
    };
    if (DT_END)
        DT_INTERVAL = Interval.fromDateTimes(DT_INVOKED, DT_END);

    return {
        invoked: DT_INVOKED,
        end: DT_END,
        interval: DT_INTERVAL,
        duration: intervalToStrings(DT_INTERVAL)
    }
}

/**
 * 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Interval}
 */
function createInterval(startDate, endDate) {
    return Interval.fromDateTimes(DateTime.fromJSDate(startDate), DateTime.fromJSDate(endDate));
}

/**
 * @typedef {object} DurationStr
 * @property {DurationObject} object
 * @property {string[]} string
 * 
 * @typedef {object} DurationOut
 * @property {DateTime} invoked
 * @property {DateTime} until
 * @property {Interval} interval
 * @property {DurationStr} duration
 */

module.exports = {
    parseDuration,
    intervalToStrings,
    createInterval,
    DT_PRINT_FORMAT,
    DURATION_REGEXP,
    CHECK_FOR_DURATION_REGEXP
}