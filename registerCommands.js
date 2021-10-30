'use strict';

const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { join } = require("path");
const requireAll = require("require-all");
const configFile = require("./config.json");
const fetch = requireAll({ dirname: join(__dirname, "registerCmds") });
const rest = new REST({ version: "9" }).setToken(configFile.token);

const args = process.argv.slice(2);

let commandCategories = [];
let parMes = "";

if (args[0] && args[0] !== "null") {
    parMes += "Command/category: " + fetch[args[0]].name + "\n";
    commandCategories.push(fetch[args[0]]);
} else {
    for (const U in fetch) {
        if (!fetch[U].name) continue;
        parMes += fetch[U].name + "\n";
        commandCategories.push(fetch[U]);
    }
}

async function register() {
    if (args[1]) parMes += "Registering in: " + args[1] + "\n";
    else parMes += "Registering globally\n";
    await rest.put(
        args[1] ?
            Routes.applicationGuildCommands(configFile.appId,
                args[1] === "home" ?
                    configFile.home : args[1]) :
            Routes.applicationCommands(configFile.appId),
        { body: commandCategories }
    );
}

register().then(() => {
    console.log(parMes + "Count:", commandCategories.length);
    process.exit();
});

"772073587792281600" // The Life
"823176176641376296" // yes uwu
"274557343058886666" // Black Wolf Test Server (missing access)
"766775751412023297" // Cweenie server
"759073471903957064" // thights
