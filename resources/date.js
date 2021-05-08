'use strict';

/**
 * @param {Number} duration - Original duration
 * @param {String} value (24h)
 * @param {Number} multi - Multiplier
 * @returns {Number}
 * @example
 * const duration = muteDurationMultiplier(5000, 23h, 1 * 60 * 60 * 1000);
 */
function muteDurationMultiplier(duration, value, multi = 0) {
    const digit = parseInt(value.match(/\d+/), 10);
    return duration + digit * multi;
}

module.exports = { muteDurationMultiplier }