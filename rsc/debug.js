'use strict';

// ---------------- DEBUGGING ----------------
// Debug helpers

function timestampAt(client) {
    const date = new Date(new Date().valueOf() + (client?.matchTimestamp ? client.matchTimestamp : 0)),
        string = date.toLocaleTimeString("UTC", { "day": "numeric", "month": "2-digit", "year": "2-digit", "hour12": true }),
        ampm = string.slice(string.length - 3),
        miliseconds = date.getUTCMilliseconds(),
        result = string.slice(0, -3) + "." + miliseconds + ampm;
    return "At: " + result;
};

/**
 * 
 * @param {object} object
 * @returns {import("discord.js").MessageOptions}
 */
function makeJSONMessage(object) {
    logDev(typeof object, object);
    return { content: '```js\n' + JSON.stringify(object, (k, v) => v || undefined, 2) + '```', split: { maxLength: 2000, char: ",", append: ',```', prepend: '```js\n' } };
}

function logDev(...debug) {
    if (!process.dev) return;
    if (debug.some(r => r instanceof Error)) console.error(...debug);
    else console.debug(...debug);
    console.log(">", Date().slice(0, -34));
}

module.exports = {
    timestampAt,
    makeJSONMessage,
    logDev
}