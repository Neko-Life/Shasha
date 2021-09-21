
const configFile = require('../config.json');
const { join } = require('path');
const requireAll = require("require-all");

function dispatch(client) {
    client.eventHandlers = requireAll({ dirname: join(__dirname, "eventHandlers") });
    client.commands = requireAll({ dirname: join(__dirname, "cmds"), recursive: true });
    client.selectMenus = requireAll({ dirname: join(__dirname, "selectMenus"), recursive: true });
    client.handledCommands = new Map();
    client.activeSelectMenus = new Map();
    let count = 0;
    for (const U in client.eventHandlers) {
        client.on(U, async (...args) => {
            client.eventHandlers[U].handle(client, ...args);
        });
        count++;
    }
    console.log(count, "listeners loaded.");
}

module.exports = { dispatch }