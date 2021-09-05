'use strict';

const { MessageEmbed, Role } = require("discord.js");
const { Interval, DateTime } = require("luxon");
const { Command } = require("../../classes/Command");
const getColor = require("../../getColor");
const { intervalToStrings } = require("../../rsc/Duration");

module.exports = class ProfileCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "profile",
            description: "Show someone's profile",
            clientPermissions: ["EMBED_LINKS"]
        });
    }

    async run(inter, { user }) {
        let member = user?.member || inter.member;
        if (!user) user = inter.user;
        else user = user.user;
        const emb = new MessageEmbed()
            .setTitle(`\`${user.tag}\`'s profile`)
            .setThumbnail(user.displayAvatarURL({ size: 4096, format: "png", dynamic: true }))
            .addField("Identifier", `<@${user.id}>\n(${user.id})`)
            .addField("Registered", "<t:" + Math.floor(user.createdTimestamp / 1000) + ":F>\n"
                + `(${intervalToStrings(
                    Interval.fromDateTimes(
                        DateTime.fromJSDate(user.createdAt),
                        DateTime.fromJSDate(new Date())
                    )
                ).strings.join(" ")} ago)`);
        if (member) {
            /**
             * @type {Role[]}
             */
            const roles = member.roles.cache.sort(
                (a, b) => b.position - a.position
            ).map(r => r.id).slice(0, -1);
            const showRoles = roles.slice(0, 42);
            const left = roles.slice(42);
            emb.addField("Nick", `\`${member.displayName}\``)
                .addField("Joined", "<t:" + Math.floor(member.joinedTimestamp / 1000) + ":F>\n"
                    + `(${intervalToStrings(Interval.fromDateTimes(
                        DateTime.fromJSDate(member.joinedAt),
                        DateTime.fromJSDate(new Date())
                    )).strings.join(" ")} ago)`)
                .addField("Roles",
                    ("<@&" + showRoles.join(">, <@&") + ">")
                    + (left.length
                        ? ` and ${left.length} more...`
                        : ""))
                .setColor(getColor(member.displayColor));
        }
        return inter.reply({ embeds: [emb] });
    }
}