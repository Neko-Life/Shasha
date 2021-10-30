'use strict';

const { MessageEmbed, Role, MessageActionRow, MessageSelectMenu, GuildMember, User } = require("discord.js");
const { Interval, DateTime } = require("luxon");
const { Command } = require("../../classes/Command");
const { tickTag } = require("../../functions");
const { getColor } = require("../../functions");
const { intervalToStrings } = require("../../rsc/Duration");

module.exports = class ProfileCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "profile",
            description: "Show someone's profile",
            clientPermissions: ["EMBED_LINKS"]
        });
    }

    /**
     * 
     * @param {*} inter 
     * @param {{user: User}} param1 
     * @returns 
     */
    async run(inter, { user }) {
        await inter.deferReply();
        /**
         * @type {GuildMember}
         */
        let member;
        if (user) {
            member = user.member;
            user = user.user;
        } else {
            user = inter.user;
            member = inter.member;
        }
        await user.fetch();
        const fStr = [];
        const uFlags = user.flags.serialize();
        for (const F in uFlags) {
            if (!uFlags[F]) continue;
            fStr.push(F);
        }

        const userAvatar = user.displayAvatarURL({ size: 4096, format: "png", dynamic: true });

        const baseEmbed = new MessageEmbed()
            .setColor(getColor(member?.displayColor));

        const generalEmbed = new MessageEmbed(baseEmbed)
            .setTitle(`${tickTag(user)}'s Profile`)
            .setThumbnail(userAvatar)
            .addField("Identifier", `<@${user.id}>\n(${user.id})`)
            .addField("Registered", "<t:" + Math.floor(user.createdTimestamp / 1000) + ":F>\n"
                + `(${intervalToStrings(
                    Interval.fromDateTimes(
                        DateTime.fromJSDate(user.createdAt),
                        DateTime.fromJSDate(new Date())
                    )
                ).strings.join(" ")} ago)`);

        if (fStr.length) generalEmbed.addField("Badges", "```js\n" + fStr.join(", ") + "```");

        const selectMenuDatas = {
            generalPage: {
                embeds: [generalEmbed]
            }
        };

        /**
         * @type {import("discord.js").MessageSelectOptionData[]}
         */
        const menuOptions = [{
            label: "Profile",
            description: "General information",
            value: "generalPage"
        }];

        if (member) {
            const memberAvatar = member.displayAvatarURL({ size: 4096, format: "png", dynamic: true });
            generalEmbed.addField("Nick", `\`${member.displayName}\``)
                .addField("Joined", "<t:" + Math.floor(member.joinedTimestamp / 1000) + ":F>\n"
                    + `(${intervalToStrings(Interval.fromDateTimes(
                        DateTime.fromJSDate(member.joinedAt),
                        DateTime.fromJSDate(new Date())
                    )).strings.join(" ")} ago)`);

            /**
             * @type {Role[]}
             */
            const roles = member.roles.cache.sort(
                (a, b) => b.position - a.position
            ).map(r => r.id).slice(0, -1);

            if (roles.length) {
                const rolesEmbed = new MessageEmbed(baseEmbed)
                    .setTitle(`${tickTag(user)}'s Roles`)
                    .setDescription("<@&" + roles.join(">, <@&") + ">");
                selectMenuDatas.rolesPage = {
                    embeds: [rolesEmbed]
                };
                menuOptions.push({
                    label: "Roles",
                    value: "rolesPage",
                    description: "Show roles"
                });
            }

            addUserAvatarPage();

            if (memberAvatar && userAvatar !== memberAvatar) {
                const memberAvatarEmbed = new MessageEmbed(baseEmbed)
                    .setImage(memberAvatar)
                    .setTitle(tickTag(user) + "'s Server Avatar");
                selectMenuDatas.memberAvatarPage = {
                    embeds: [memberAvatarEmbed]
                };
                menuOptions.push({
                    label: "Server Avatar",
                    description: "Avatar specific for this server",
                    value: "memberAvatarPage"
                });
            }
        }

        if (!selectMenuDatas.userAvatarPage) addUserAvatarPage();

        function addUserAvatarPage() {
            if (!userAvatar) return;
            const userAvatarEmbed = new MessageEmbed(baseEmbed)
                .setTitle(tickTag(user) + "'s Avatar")
                .setImage(userAvatar);
            selectMenuDatas.userAvatarPage = {
                embeds: [userAvatarEmbed]
            };
            menuOptions.push({
                label: "Avatar",
                description: "Default avatar",
                value: "userAvatarPage"
            });
        }

        const userBanner = user.bannerURL({ size: 4096, format: "png", dynamic: true });

        if (userBanner) {
            const userBannerEmbed = new MessageEmbed(baseEmbed)
                .setImage(userBanner)
                .setTitle(tickTag(user) + "'s Banner");
            selectMenuDatas.userBannerPage = {
                embeds: [userBannerEmbed]
            };
            menuOptions.push({
                label: "Banner",
                description: "Show banner",
                value: "userBannerPage"
            });
        }

        const menu = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setPlaceholder("Browse...")
                    .setCustomId("single")
                    .setMaxValues(1)
                    .setOptions(menuOptions)
            );

        const replyInter = { embeds: [generalEmbed] }

        if (menuOptions.length > 1) {
            replyInter.components = [menu];
            for (const k in selectMenuDatas)
                selectMenuDatas[k].components = [menu];
        }

        const mes = await inter.editReply(replyInter);
        await this.client.createSelectMenu(mes.id, selectMenuDatas);
        return mes;
    }
}