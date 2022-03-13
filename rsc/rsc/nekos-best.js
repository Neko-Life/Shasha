"use strict";

const { Client } = require("nekos-best.js");

module.exports = null;
new Client().init().then(r => module.exports = r);
