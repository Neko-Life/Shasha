'use strict';

const { Command } = require("../../classes/Command");
const { join } = require("path");
const { Worker } = require("worker_threads");
const { ASCII_FONTS } = require("../../constants");

module.exports = class ASCIICmd extends Command {
    constructor(interaction) {
        const cmd = {};
        for (const k of ASCII_FONTS)
            cmd[k] = k;
        super(interaction, {
            name: "ascii",
            autocomplete: {
                commands: {
                    font: cmd
                }
            }
        });
    }

    async run(inter, { text, font }) {
        await inter.deferReply();
        const fonts = Object.values(this.autocomplete.commands.font);
        let fN = "";
        if (!font) {
            const f = fonts[Math.floor(Math.random() * fonts.length)];
            font = {
                value: f
            };
            fN = "`" + f + "`";
        }
        if (!fonts.includes(font.value))
            return inter.editReply("That font got uninstalled!! Go to my support server and kill the devs!");
        if (!text)
            text = { value: "No text?" };
        const data = {
            text: text.value,
            method: "font",
            font: font.value,
            dev: process.dev
        }
        const child = new Worker(join(__dirname, "../../workers/ascii.js"), {
            workerData: data
        });
        child.on("message", (art) => {
            art = art.replace(/\s+(?=\n)|^\n/gm, "");
            if (art.length > 1950) return inter.editReply("Art length too long discord blocked it :<");
            inter.editReply("```\n" + art + "``` " + fN);
        });
        child.on("error", err);
        child.on("messageerror", err);

        function err(...e) {
            inter.editReply("Somethin's at fault. I wish i can blame you :<");
            process.emit("error", ...e);
        }
    }
}