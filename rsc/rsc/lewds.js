'use strict';

const { LewdClient } = require('lewds.api');
module.exports = new LewdClient({ KEY: require("../../config.json").lewdsAPIkey });