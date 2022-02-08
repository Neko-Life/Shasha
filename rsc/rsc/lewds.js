"use strict";

const { lewdsAPIkey } = require("../../config.json");
const { AhniClient } = require('ahnidev');
module.exports = new AhniClient({ KEY: lewdsAPIkey });