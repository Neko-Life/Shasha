'use strict';

const { lewdsAPIkey } = require("../../config.json");
const { LewdClient } = require('lewds.api');
module.exports = new LewdClient({ KEY: lewdsAPIkey });