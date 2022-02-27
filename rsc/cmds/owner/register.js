"use strict";

const { join } = require("path");
const requireAll = require("require-all");
const { Command } = require("../../classes/Command");
const configFile = require("../../../config.json");
const { Worker } = require("worker_threads");
const { logDev } = require("../../debug");

module.exports = class RegisterCommandsCmd extends Command {
    constructor(interaction) {
        const categories = requireAll({ dirname: join(__dirname, "../../../registerCmds") });
        const toCommands = {
            category: {},
            guild: {}
        }
        for (const k in categories)
            toCommands.category[k] = k;
        for (const [k, v] of interaction.client?.guilds.cache || [])
            toCommands.guild[k] = { name: v.name, value: v.id };
        super(interaction, {
            name: "register",
            ownerOnly: true,
            autocomplete: {
                matchKey: true,
                commands: toCommands
            }
        });
        this.categories = categories;
    }

    async run(inter, { category, guild }) {
        await inter.deferReply();

        if (!category) category = { value: "null" };
        let G;
        if (guild?.value) {
            if (guild.value.toLowerCase() === "home") {
                G = inter.client.guilds.cache.get(configFile.home);
                if (!G) throw new Error("home not found!");
                guild = "home";
            } else if (guild.value.toLowerCase() === "here") {
                G = inter.guild;
                guild = inter.guild.id;
            } else {
                G = inter.client.findGuilds(guild.value, "i", true);
                if (G instanceof Map) G = G.first();
                if (!G) throw new Error("Unknown Guild");
                guild = G.id;
            }
        }

        const bf = new Date();
        const toArgv = (process.dev ? "-d " : "") + (category.value + " " + (guild || ""));
        const argv = toArgv.length
            ? toArgv.split(" ")
            : [];
        const child = new Worker(join(__dirname, "../../../registerCommands.js"), {
            argv: argv
        });
        child.on("online", (...arg) => logDev("[ WORKER Register ] Online"
            + (argv.length ? " with args \"" + argv.join(" ") + '"' : "")));
        child.on("error", async (msg) => {
            await inter.channel.send("```js\n" + msg.stack + "```");
        });
        child.on("message", async (msg) => {
            await inter.channel.send(msg + "\nRegistered in: `" + (G?.name || "GLOBAL") + "`");
        });
        child.on("messageerror", async (msg) => {
            await inter.channel.send("```js\n" + msg.stack + "```");
        });
        child.on("exit", () => {
            const af = new Date();
            inter.editReply("```js\nExecuted in " + ((af.valueOf() - bf.valueOf()) / 1000) + " s```");
        });
        inter.editReply("Please wait...");
    }
}
