"use strict";

const { MessageEmbed } = require("discord.js");
const { Command } = require("../../classes/Command");
const { Moderation } = require("../../classes/Moderation");
const { replyHigherThanMod, unixToSeconds, tickTag, getColor } = require("../../functions");

module.exports = class KickCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "kick",
            userPermissions: ["KICK_MEMBERS"],
            clientPermissions: ["KICK_MEMBERS"],
            guildOnly: true
        });
    }
    async run(inter, { member, reason }) {
        if (!member?.member) return inter.reply("You can't kick someone who's not a mom <:senkoStareLife:853238498223325204>");
        await inter.deferReply();
        const invoked = new Date();
        const mod = new Moderation(this.client, {
            guild: this.guild, targets: member.user, moderator: this.member
        });
        const res = await mod.kick({ invoked: invoked, reason: reason?.value });
        if (!res.kicked.length)
            if (replyHigherThanMod(inter, "kick", res))
                return;
        const ex = res.kicked[0];
        const emb = new MessageEmbed()
            .setColor(getColor(this.member.accentColor, true, this.member.displayColor))
            .setThumbnail(ex.member.displayAvatarURL({ size: 4096, format: "png", dynamic: true }))
            .setTitle("Kick")
            .addField("User", tickTag(ex.member)
                + `\n<@${ex.member.id}>`
                + `\n(${ex.member.id})`)
            .addField("At", "<t:" + unixToSeconds(invoked) + ":F>");
        if (reason) emb.setDescription(reason.value);
        return inter.editReply({ embeds: [emb] });
    }
}
