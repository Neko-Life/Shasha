"use strict";

const { MessageEmbed } = require("discord.js");
const { Command } = require("../../classes/Command");
const { Lockdown } = require("../../classes/Lockdown");
const { logDev } = require("../../debug");
const { replyError, getColor, unixToSeconds, addS } = require("../../functions");
const { intervalToStrings, createInterval } = require("../../util/Duration");
const { getTargets } = require("./lock");

module.exports = class UnlockCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "unlock",
            guildOnly: true,
            userPermissions: ["ADMINISTRATOR"],
            clientPermissions: ["ADMINISTRATOR"],
        });
    }

    async run(inter, { channels, category, reason }) {
        const invoked = new Date();
        await inter.reply("Targeting, please wait...");
        const targets = await getTargets(inter, this.guild, this.channel, channels, category, true);
        if (!targets) return;
        await inter.editReply(`Unlocking ${targets.length} channel${addS(targets)}... This message will be edited when done...`)
        const mod = new Lockdown(targets, this.member, {
            reason: reason?.value,
        });
        let executed;
        try {
            executed = await mod.unlock();
        } catch (e) {
            logDev(e);
            return inter.editReply(replyError(e));
        }
        if (!executed.executed.length) return inter.editReply("Seems like all of em aren't locked!");

        const done = executed.executed.map(r => r.channel.id);
        const alr = executed.already.map(r => r.id);
        let desc = "**Executed**:\n";
        desc += "<#" + done.join(">, <#") + ">";

        if (alr.length) {
            desc += "\n\n**Not locked**:\n";
            desc += "<#" + alr.join(">, <#") + ">";
        }

        const emb = new MessageEmbed()
            .setColor(getColor(this.user.accentColor, true, this.member.displayColor))
            .setTitle("Unlock")
            .setDescription(desc.slice(0, 4000))
            .setFooter({ text: `Took ${intervalToStrings(createInterval(invoked, new Date())).strings.join(" ")} to execute ${done.length} channel${addS(done)}` });
        if (reason)
            emb.addField("Reason", reason.value);
        emb.addField("At", "<t:" + unixToSeconds(invoked) + ":F>", true);

        return inter.editReply({ embeds: [emb] });
    }
}
