"use strict";

const { MessageEmbed } = require("discord.js");
const { Command } = require("../../classes/Command");
const { ShaBaseDb } = require("../../classes/Database");
const { Moderation } = require("../../classes/Moderation");
const { logDev } = require("../../debug");
const { getColor, tickTag, unixToSeconds, replyError } = require("../../functions");
const { database } = require("../../mongo");

module.exports = class UnmuteCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "unmute",
            clientPermissions: ["MANAGE_ROLES"],
            userPermissions: ["MANAGE_ROLES"],
            guildOnly: true
        });
    }
    async run(inter, { user, reason }) {
        if (!user) return inter.reply("Unmute? the WinD? Unmute Shasha pls :>>")
        const invoked = new Date();
        await inter.deferReply();
        const db = new ShaBaseDb(database, "member/" + this.guild.id + "/" + user.user.id);
        const get = await db.getOne("muted", "Object");
        const muted = get?.value || {};
        if (!muted.state)
            return inter.editReply(replyError({ message: "Unknown Mute" }));
        const mod = new Moderation(this.client, {
            guild: this.guild, targets: user.user, moderator: this.member
        });
        const dST = new Date();
        const res = await mod.unmute({ invoked: invoked, reason: reason?.value });
        const dSE = new Date();
        logDev(dSE.valueOf() - dST.valueOf());
        const ex = res.unmuted[0];
        const emb = new MessageEmbed()
            .setTitle("Unmute")
            .setColor(getColor(this.user.accentColor, true, this.member.displayColor))
            .setThumbnail(ex.user.displayAvatarURL({ size: 4096, format: "png", dynamic: true }))
            .addField("User", tickTag(ex.user.user || ex.user)
                + `\n<@${ex.user.id}>`
                + `\n(${ex.user.id})`)
            .addField("At", "<t:" + unixToSeconds(invoked) + ":F>")
            .setDescription(ex.val.reason);
        return inter.editReply({ embeds: [emb] });
    }
}
