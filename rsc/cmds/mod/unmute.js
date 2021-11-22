'use strict';

const { MessageEmbed } = require("discord.js");
const { Command } = require("../../classes/Command");
const { Moderation } = require("../../classes/Moderation");
const { loadDb } = require("../../database");
const { getColor, tickTag, unixToSeconds } = require("../../functions");

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
            return inter.editReply("That user isn't muted. Consider muting them first <:senkoStareLife:853238498223325204>");
        Moderation.loadModeration(this.guild);
        const moderation = new Moderation(this.client, {
            guild: this.guild, targets: user.user, moderator: this.member
        });
        const res = await moderation.unmute({ invoked: invoked, reason: reason?.value });
        const emb = new MessageEmbed()
            .setTitle("Unmute")
            .setColor(getColor(this.user.accentColor, true) || getColor(this.member.displayColor, true))
            .setThumbnail(res.unmuted[0].user.displayAvatarURL({ size: 4096, format: "png", dynamic: true }))
            .addField("User", tickTag(res.unmuted[0].user.user || res.unmuted[0].user) + `\n(${res.unmuted[0].user.id})`)
            .addField("At", "<t:" + unixToSeconds(invoked.valueOf()) + ":F>")
            .setDescription(res.unmuted[0].val.reason);
        return inter.editReply({ embeds: [emb] });
    }
}