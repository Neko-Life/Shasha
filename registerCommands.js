'use strict';

const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { join } = require("path");
const requireAll = require("require-all");
const configFile = require("./config.json");
const fetch = requireAll({ dirname: join(__dirname, "registerCmds"), recursive: true });
const rest = new REST({ version: "9" }).setToken(configFile.token);

let commandCategories = [];

for (const U in fetch) {
    if (!fetch[U].name) continue;
    commandCategories.push(fetch[U]);
}

(async () => {
    try {
        console.log("Registering slash commands...");
        await rest.put(
            Routes.applicationGuildCommands(configFile.appId, configFile.home),
            { body: commandCategories }
        );

        console.log("Registered", commandCategories.length, "commands/categories.");
    } catch (e) {
        console.error(e);
    }
})();

"772073587792281600" // The Life
"823176176641376296" // yes uwu
"274557343058886666" // Black Wolf Test Server (missing access)
"766775751412023297" // Cweenie server

