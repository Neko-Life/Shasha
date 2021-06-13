'use strict';

function timestampAt(client) {
    const date = new Date(new Date().valueOf() + (client?.matchTimestamp ? client.matchTimestamp : 0)),
    string = date.toLocaleTimeString("UTC", {"day": "numeric", "month": "2-digit", "year": "2-digit", "hour12": true}),
    ampm = string.slice(string.length - 3),
    miliseconds = date.getUTCMilliseconds(),
    result = string.slice(0, -3) + "." + miliseconds + ampm;
    return "At: " + result;
};

module.exports = { timestampAt }