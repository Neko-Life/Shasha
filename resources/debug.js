'use strict';

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
 * @param {String} string
 * @returns {import("discord.js").MessageOptions}
 */
function makeJSONMessage(string) {
    return { content: '```js\n' + JSON.stringify(string, (k, v) => v ?? undefined, 2) + '```', split: { maxLength: 2000, char: ",", append: ',```', prepend: '```js\n' } };
}

module.exports = { timestampAt, makeJSONMessage }