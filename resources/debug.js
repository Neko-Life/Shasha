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
 * @param {object} object
 * @returns {import("discord.js").MessageOptions}
 */
function makeJSONMessage(object) {
    console.log(typeof object, object);
    return { content: '```js\n' + JSON.stringify(object, (k, v) => v || undefined, 2) + '```', split: { maxLength: 2000, char: ",", append: ',```', prepend: '```js\n' } };
}

module.exports = { timestampAt, makeJSONMessage }