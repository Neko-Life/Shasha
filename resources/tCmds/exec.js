'use strict';

const { exec } = require("child_process");
const { execCB } = require("../functions");

module.exports = {
    description: "Execute zsh terminal command",
    run(client, arg) {
        return exec(arg, execCB);
    }
}