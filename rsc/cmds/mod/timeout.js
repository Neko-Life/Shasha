"use strict";

const { Command } = require("../../classes/Command");
const { Moderation } = require("../../classes/Moderation");
const { loadDb } = require("../../database");
const { replyError, replyHigherThanMod, timedPunishmentModEmbed } = require("../../functions");

module.exports = class TimeoutCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "timeout",
            clientPermissions: ["MODERATE_MEMBERS"],
            userPermissions: ["MODERATE_MEMBERS"],
            guildOnly: true,
        });
    }

    /**
     * 
     * @param {import("../../typins").ShaCommandInteraction} inter
     * @param {*} param1
     */
    async run(inter, { kid, reason, duration }) {
        if (!kid.member) return inter.reply("Can't timeout kids from outta the server :\\");
        const invoked = new Date();
        await inter.deferReply();
        const gd = loadDb(this.guild, `guild/${this.guild.id}`);
        const get = await gd.db.getOne("timeoutSettings", "Object");
        const settings = get?.value || {};
        let parse;
        try {
            parse = Moderation.defaultParseDuration(invoked, duration.value, settings.duration);
        } catch (e) {
            return inter.editReply(replyError(e));
        }
        if (!parse?.ms) return inter.editReply("How long? You don't want me to timeout them for 273735 years right?");
        const mod = new Moderation(this.client, {
            guild: this.guild, moderator: this.member, targets: kid.user,
        });
        const res = await mod.timeout({ invoked, end: parse.end, reason: reason?.value });
        if (!res.timedOut?.length) {
            return replyHigherThanMod(inter, "timeout", res);
        }
        return inter.editReply({
            embeds: [timedPunishmentModEmbed("Timeout",
                this.member,
                res.timedOut.map(r => r.member),
                {
                    reason: res.timedOut[0].opt.reason,
                    durationStr: parse.duration.strings.join(" "),
                    end: parse.end,
                    invoked,
                })]
        });
    }
}