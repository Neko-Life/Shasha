"use strict";

const { Command } = require("../../classes/Command");
const art = require("figlet");
const { replyError } = require("../../functions");
let { ASCII_FONTS } = require("../../constants");

module.exports = class ASCIICmd extends Command {
    constructor(interaction) {
        if (ASCII_FONTS === undefined)
            ASCII_FONTS = require("../../constants").ASCII_FONTS;
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
        return art(text?.value || "NoTeXt?", font.value, (e, r) => {
            if (e) {
                return inter.editReply("Somethin's at fault. I wish i can blame you :<\n" + replyError(e));
            }
            if (r.length > 1950) return inter.editReply("Art length too long discord blocked it :<");
            return inter.editReply(fN + " ```\n" + (r + "\n").replace(/\s+(?=\n)|^\n/gm, "") + "```");
        });
    }
}