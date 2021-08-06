'use strict';

const { DateTime, Settings, Interval, DurationObject } = require("luxon"),
    DURATION_REGEXP = /[\-]?\d+(?![^ymwdhs])[ymwdhs]?o?/gi,
    DT_PRINT_FORMAT = "DDD'\n'cccc',' tt",
    CHECK_FOR_DURATION_REGEXP = /^[\-\+]?\d{1,16}(?![^ymwdhs])[ymwdhs]?o?/i;

Settings.defaultZone = "utc";
/**
 * 
 * @param {Interval} interval 
 * @returns {{ "object": DurationObject, strings: string[] }}
 */
function intervalToDuration(interval) {
    if (!(interval instanceof Interval)) return;
    const object = interval.toDuration(["years", "months", "days", "hours", "minutes", "seconds"], { conversionAccuracy: "longterm" }).toObject();
    let strings = [];
    for (const S in object) {
        object[S] = Math.floor(object[S]);
        if (object[S] > 0) strings.push(`${object[S]} ${object[S] === 1 ? S.slice(0, -1) : S}`); else continue;
    }
    if (strings.length > 0) {
        if (strings.length > 1) strings[strings.length - 2] += " and";
    }
    return { object, strings };
};

/**
 * @param {Date} base - Base date
 * @param {string} string - To match /[\-]?\d+(?![^ymwdhs])[ymwdhs]?o?/gi
 */
function duration(base, string) {
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

    for (const value of DURATION_ARGS) {
        const val = parseInt(value.match(/[\-]?\d+/)[0], 10);
        if (!val) continue;
        if (value.endsWith("h") || value.endsWith("ho")) {
            DURATION.hour = DURATION.hour + val;
            if (!changed) changed = true;
            continue;
        }
        if (value.endsWith("y")) {
            DURATION.year = DURATION.year + val;
            if (!changed) changed = true;
            continue;
        }
        if (value.endsWith("mo")) {
            DURATION.month = DURATION.month + val;
            if (!changed) changed = true;
            continue;
        }
        if (value.endsWith("w")) {
            DURATION.day = DURATION.day + 7 * val;
            if (!changed) changed = true;
            continue;
        }
        if (value.endsWith("d")) {
            DURATION.day = DURATION.day + val;
            if (!changed) changed = true;
            continue;
        }
        if (value.endsWith("m") || !/[^\d\-\+]/.test(value)) {
            DURATION.minute = DURATION.minute + val;
            if (!changed) changed = true;
            continue;
        }
        if (value.endsWith("s")) {
            DURATION.second = DURATION.second + val;
            if (!changed) changed = true;
            continue;
        }
    }
    let DT_END, DT_INTERVAL;

    if (changed) DT_END = DateTime.fromJSDate(new Date(DURATION.year, DURATION.month, DURATION.day, DURATION.hour, DURATION.minute, DURATION.second));
    if (DT_END) DT_INTERVAL = Interval.fromDateTimes(DT_INVOKED, DT_END)
    return { invoked: DT_INVOKED, until: DT_END, interval: DT_INTERVAL, duration: intervalToDuration(DT_INTERVAL) }
}

module.exports = { duration, DT_PRINT_FORMAT, intervalToDuration, DURATION_REGEXP, CHECK_FOR_DURATION_REGEXP }