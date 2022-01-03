'use strict';

const { MessageEmbed, Role, MessageActionRow, MessageSelectMenu, GuildMember, User } = require("discord.js");
const { Command } = require("../../classes/Command");
const { getColor } = require("../../functions");
const { intervalToStrings, createInterval } = require("../../util/Duration");

module.exports = class ProfileCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "profile",
            description: "Show someone's profile",
            clientPermissions: ["VIEW_CHANNEL", "EMBED_LINKS"]
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

        const memberAvatar = member?.displayAvatarURL({ size: 4096, format: "png", dynamic: true });
        const userAvatar = user.displayAvatarURL({ size: 4096, format: "png", dynamic: true });

        const baseEmbed = new MessageEmbed()
            .setAuthor({ name: `${user.bot ? "BOT " : ""}${user.tag}`, iconURL: memberAvatar || userAvatar })
            .setColor(getColor(user.accentColor, true) || getColor(member?.displayColor, true));

        const generalEmbed = new MessageEmbed(baseEmbed)
            .setTitle("Profile")
            .addField("Identifier", `<@${user.id}>\n(${user.id})`, true)
            .addField("Registered", "<t:" + Math.floor(user.createdTimestamp / 1000) + ":F>\n"
                + `(${intervalToStrings(
                    createInterval(user.createdAt, new Date())
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
            generalEmbed
                .addField("Joined", "<t:" + Math.floor(member.joinedTimestamp / 1000) + ":F>\n"
                    + `(${intervalToStrings(
                        createInterval(member.joinedAt, new Date())
                    ).strings.join(" ")} ago)`)
                .fields.splice(1, 0, { name: "Nick", value: `\`${member.displayName}\``, inline: true });

            /**
             * @type {Role[]}
             */
            const roles = member.roles.cache.sort(
                (a, b) => b.position - a.position
            ).map(r => r.id).slice(0, -1);

            if (roles.length) {
                if (roles.length <= 42)
                    generalEmbed.addField("Roles", "<@&" + roles.join(">, <@&") + ">");
                else {
                    const rolesEmbed = new MessageEmbed(baseEmbed)
                        .setTitle("Roles")
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
            }

            addUserAvatarPage();

            if (memberAvatar && userAvatar !== memberAvatar) {
                const memberAvatarEmbed = new MessageEmbed(baseEmbed)
                    .setImage(memberAvatar)
                    .setTitle("Server Avatar");
                selectMenuDatas.memberAvatarPage = {
                    embeds: [memberAvatarEmbed]
                };
                menuOptions.push({
                    label: "Server Avatar",
                    description: "Avatar specific for this server",
                    value: "memberAvatarPage"
                });
            }
        } else addUserAvatarPage();

        const userBanner = user.bannerURL({ size: 4096, format: "png", dynamic: true });

        if (userBanner) {
            const userBannerEmbed = new MessageEmbed(baseEmbed)
                .setImage(userBanner)
                .setTitle("Banner");
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
                    .setCustomId("pages")
                    .setMaxValues(1)
                    .setOptions(menuOptions)
            );

        if (menuOptions.length > 1) {
            for (const k in selectMenuDatas)
                selectMenuDatas[k].components = [menu];
        }

        const mes = await inter.editReply(selectMenuDatas.generalPage);
        await this.client.createMessageInteraction(mes.id, {
            PAGES: selectMenuDatas
        });
        return mes;

        function addUserAvatarPage() {
            if (!userAvatar) return;
            const userAvatarEmbed = new MessageEmbed(baseEmbed)
                .setTitle("Avatar")
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
    }
}