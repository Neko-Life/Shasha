"use strict";

const { MessageEmbed } = require("discord.js");
const { Command } = require("../../classes/Command");
const { Moderation } = require("../../classes/Moderation");
const { logDev } = require("../../debug");
const { replyError, tickTag, getColor, unixToSeconds } = require("../../functions");

module.exports = class UnbanCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "unban",
            userPermissions: ["ADMINISTRATOR"],
            clientPermissions: ["ADMINISTRATOR"],
            guildOnly: true
        });
    }

    async run(inter, { user, reason }) {
        if (!user?.user) return inter.reply("Who you gonna unban daddy?");
        const invoked = new Date();
        await inter.deferReply();
        const mod = new Moderation(this.client, {
            guild: this.guild, targets: user.user, moderator: inter.member
        });
        try {
            const res = await mod.unban({ reason: reason?.value, invoked: invoked });

            const emb = new MessageEmbed()
                .setTitle("Unban")
                .setColor(getColor(this.user.accentColor, true) || getColor(this.member.displayColor, true))
                .setThumbnail(res.unbanned[0].user.displayAvatarURL({ size: 4096, format: "png", dynamic: true }))
                .addField("User", tickTag(res.unbanned[0].user.user || res.unbanned[0].user)
                    + `\n<@${res.unbanned[0].user.id}>`
                    + `\n(${res.unbanned[0].user.id})`)
                .addField("At", "<t:" + unixToSeconds(invoked) + ":F>")
                .setDescription(res.unbanned[0].res.reason);
            return inter.editReply({ embeds: [emb] });
        } catch (e) {
            logDev(e);
            return inter.editReply(replyError(e));
        }
    }
}
