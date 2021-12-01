'use strict';

const { MessageEmbed } = require("discord.js");
const { Command } = require("../../classes/Command");
const { Moderation } = require("../../classes/Moderation");
const { loadDb } = require("../../database");
const { logDev } = require("../../debug");
const { getColor, tickTag, unixToSeconds, replyError } = require("../../functions");

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
        const invoked = new Date();
        await inter.deferReply();
        const ud = loadDb(user.user, "member/" + this.guild.id + "/" + user.user.id);
        const get = await ud.db.getOne("muted", "Object");
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
        const emb = new MessageEmbed()
            .setTitle("Unmute")
            .setColor(getColor(this.user.accentColor, true) || getColor(this.member.displayColor, true))
            .setThumbnail(res.unmuted[0].user.displayAvatarURL({ size: 4096, format: "png", dynamic: true }))
            .addField("User", tickTag(res.unmuted[0].user.user || res.unmuted[0].user)
                + `\n<@${res.unmuted[0].user.id}>`
                + `\n(${res.unmuted[0].user.id})`)
            .addField("At", "<t:" + unixToSeconds(invoked.valueOf()) + ":F>")
            .setDescription(res.unmuted[0].val.reason);
        return inter.editReply({ embeds: [emb] });
    }
}