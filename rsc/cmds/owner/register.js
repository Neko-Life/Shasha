'use strict';

const { exec } = require("child_process");
const { join } = require("path");
const requireAll = require("require-all");
const { Command } = require("../../classes/Command");
const configFile = require("../../../config.json");

module.exports = class RegisterCommandsCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "register",
            ownerOnly: true
        });
    }

    async run(inter, { category, guild }) {
        await inter.deferReply();
        const fetch = requireAll({ dirname: join(__dirname, "../../../registerCmds") });

        if (category?.value && !fetch[category.value])
            throw new Error("No command/category: " + category.value +
                "\nAvailable categories:```js\n" + Object.keys(fetch).join("\n") + "```");

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

        const child = exec("node registerCommands.js " + category.value + " " + (guild || ""));
        child.stdout.on("data", async (msg) => {
            await inter.editReply(msg + "`" + (G?.name || "GLOBAL") + "`");
        });
    }
}