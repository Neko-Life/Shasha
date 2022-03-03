"use strict";

const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { join } = require("path");
const requireAll = require("require-all");
const { parentPort } = require("worker_threads");
const configFile = require("./config.json");
const fetch = requireAll({ dirname: join(__dirname, "registerCmds") });

let args = process.argv.filter(r => !r.startsWith(__dirname));;
const dev = args[0] === "-d";

if (dev)
    args.shift();

const appId = dev ? configFile.devAppId : configFile.appId;
const token = dev ? configFile.devToken : configFile.token;

const rest = new REST({ version: "9" }).setToken(token);

const commandCategories = [];
let parMes = "";

if (args[0] && args[0] !== "null") {
    for (const k of args) {
        if (!/\D/.test(k)) continue;
        if (k.toLowerCase() === "home") continue;
        if (!fetch[k]?.name) continue;
        parMes += fetch[k].name + "\n";
        commandCategories.push(fetch[k]);
    }
} else {
    for (const U in fetch) {
        if (!fetch[U].name) continue;
        parMes += fetch[U].name + "\n";
        commandCategories.push(fetch[U]);
    }
}

async function register() {
    if (!commandCategories?.length) throw new TypeError("No command was gonna be registered");
    const guild = args[args.length - 1] === "home"
        ? configFile.home
        : !/\D/.test(args[args.length - 1])
            ? args[args.length - 1]
            : null;
    if (guild) parMes += "Registering in: " + guild + "\n";
    else parMes += "Registering globally\n";
    await rest.put(
        guild ?
            Routes.applicationGuildCommands(appId, guild) :
            Routes.applicationCommands(appId),
        { body: commandCategories }
    );
}

register().then(() => {
    const message = "Commands/categories:\n" + parMes + "Count: " + commandCategories.length;
    if (parentPort)
        parentPort.postMessage(message);
    else console.log(message);
    process.exit();
});

"772073587792281600" // The Life
"823176176641376296" // yes uwu
"274557343058886666" // Black Wolf Test Server (missing access)
"766775751412023297" // Cweenie server
"759073471903957064" // thights
