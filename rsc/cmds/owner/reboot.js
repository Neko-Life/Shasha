"use strict";

const { spawn } = require("child_process");
const { Command } = require("../../classes/Command");

module.exports = class RebootCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "reboot",
            description: "Reboot the bot",
            ownerOnly: true,
        });
    }
    async run(inter) {
        await inter.reply("Rebooting...");
        const args = (process.argv.join(" ").replace(/\s?rbc=[^\s\n]+/, "") + " rbc=" + inter.channel.id).split(" ");
        console.log("Rebooting through command `" + args + "` by", inter.user.tag, "at", Date().toString());
        spawn(args[0], args.slice(1), { detached: true, stdio: "inherit" });
        console.log("Exiting...");
        setTimeout(process.exit, 1000);
    }
}
