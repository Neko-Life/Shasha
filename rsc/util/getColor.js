'use strict';

const { RANDOM_COLOR, COLORS } = require("../constants");

/**
 * Get color by name
 * @param {keyof COLORS | string | number} name - Name of color | Hex | Number
 * @param {boolean} returnNull - Return null if no name
 * @param {keyof COLORS | string | number} fallback - Fallback to this color
 * @returns {string | number} Color hex | Color number
 */
module.exports = function getColor(name, returnNull, fallback) {
    if (!name)
        if (returnNull) return null;
        else return RANDOM_COLOR[Math.floor(Math.random() * RANDOM_COLOR.length)];
    if (typeof name === 'number') {
        if (name === 16777215) {
            return 16777214;
        } else {
            return name;
        }
    }
    const ret = COLORS[name];
    if (!ret) {
        if (fallback) return getColor(fallback, returnNull);
        if (/\D/.test(name)) {
            if (name.startsWith("#")) name = name.slice(1);
            return name;
        } else {
            const n = parseInt(name, 10);
            if (n >= 16777215) return 16777214;
            return n;
        }
    }
    return ret;
}