'use strict';

const { intervalToDuration } = require("../cmds/moderation/src/duration");
const { DateTime, Interval, Settings } = require("luxon");
Settings.defaultZone = "utc";

class TimedPunishment {
    /**    
     * @param {{userID: string, duration: { invoked: DateTime, interval: Interval, until: DateTime, duration: { "object": DurationObject, strings: string[] } }, infraction: number, type: "ban" | "mute"}} data 
     */
    constructor(data = {}) {
        this.userID = data?.userID;
        /**
         * @type {{ invoked: DateTime, interval: Interval, until: DateTime, duration: { "object": DurationObject, strings: string[] } }}
         */
        this.duration = data?.duration || {};
        this.infraction = data?.infraction;
        this.type = data?.type;
    }

    setUserID(ID) {
        this.userID = ID;
        return this;
    }

    /**
     * @param {Date} date
     */
    setInvoked(date) {
        this.duration.invoked = DateTime.fromJSDate(date);
        return this;
    }

    /**
     * @param {Date} starts
     * @param {Date} ends
     */
    setInterval(starts, ends) {
        this.duration.interval = Interval.fromDateTimes(DateTime.fromJSDate(starts), DateTime.fromJSDate(ends));
        return this;
    }

    /**
     * @param {Date} date 
     */
    setUntil(date) {
        this.duration.until = DateTime.fromJSDate(date);
        return this;
    }

    /**
     * @param {Interval} interval
     */
    setDuration(interval) {
        this.duration.duration = intervalToDuration(interval);
        return this;
    }

    /**
     * @param {Date} starts 
     * @param {Date} ends 
     */
    setDataDuration(starts, ends) {
        this.setInvoked(starts);
        this.setInterval(starts, ends);
        this.setUntil(ends);
        this.setDuration(this.duration.interval);
        return this;
    }

    setInfraction(number) {
        this.infraction = number;
        return this;
    }

    /**
     * @param {"ban" | "mute"} type 
     */
    setPunishment(type) {
        this.type = type;
        return this;
    }
}

module.exports = { TimedPunishment }