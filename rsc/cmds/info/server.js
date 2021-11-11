'use strict';

const { MessageSelectMenu, MessageActionRow, MessageEmbed, Guild } = require("discord.js");
const { Interval, DateTime } = require("luxon");
const { Command } = require("../../classes/Command");
const { fetchAllMembers, tickTag, maxStringsLength, getCommunityInvite } = require("../../functions");
const { getColor } = require("../../functions");
const { intervalToStrings } = require("../../rsc/Duration");

module.exports = class ServerInfoCmd extends Command {
    constructor(interaction) {
        const tocommands = {
            identifier: {}
        }
        const mutual = interaction.client.findMutualGuilds(interaction.user);
        for (const [k, v] of mutual)
            tocommands.identifier[k] = { name: v.name, value: v.id };
        super(interaction, {
            name: "server-info",
            clientPermissions: ["VIEW_CHANNEL", "EMBED_LINKS"],
            autocomplete: {
                matchKey: true,
                commands: tocommands,
                preview: false
            }
        });
    }

    /**
     * 
     * @param {CommandInteraction} inter 
     * @param {*} param1 
     * @returns 
     */
    async run(inter, { identifier }) {
        await inter.deferReply();
        /**
         * @type {Guild}
         */
        let server = inter.guild;
        if (identifier) server = inter.client.findGuilds(
            identifier.value, "i",
            this.isOwner
        );
        if (server instanceof Map) server = server.first();
        if (!server) return inter.editReply("Can't find that server :c");
        if (!server.available) server = await server.fetch();
        if (!server.available) return inter.editReply("Server's unavailable at the moment...");
        await fetchAllMembers(server);
        const generalInfo = {
            channelCount: server.channels.cache.size,
            owner: server.members.cache.get(server.ownerId)
        }
        const moreInfo = {
            channelTypesCount: {},
            channelNsfwCount: server.channels.cache.filter(r => r.nsfw).size,
            emoteCount: server.emojis.cache.size,
            emojiStatic: server.emojis.cache.filter(r => !r.animated).size,
            emojiAnimated: server.emojis.cache.filter(r => r.animated).size,
            botCount: server.members.cache.filter(r => r.user.bot).size,
            userCount: server.members.cache.filter(r => !r.user.bot).size,
            roleCount: server.roles.cache.size,
            stickerCount: server.stickers.cache.size,
            systemChannelFlags: (() => {
                const serial = server.systemChannelFlags.serialize();
                const ret = [];
                for (const U in serial) {
                    if (!serial[U]) continue;
                    ret.push(U);
                }
                return ret;
            })(),
            invite: (await getCommunityInvite(server))?.url
        }
        for (const C of server.channels.cache.map(r => r)) {
            if (moreInfo.channelTypesCount[C.type] === undefined)
                moreInfo.channelTypesCount[C.type] = 0;
            moreInfo.channelTypesCount[C.type]++;
        }
        const bannerURL = server.bannerURL({ size: 4096, format: "png" });
        const discoverySplashURL = server.discoverySplashURL({ size: 4096, format: "png" });
        const splashURL = server.splashURL({ size: 4096, format: "png" });
        const iconURL = server.iconURL({ size: 4096, format: "png", dynamic: true });

        const baseEmbed = new MessageEmbed()
            .setAuthor(server.name, iconURL, moreInfo.invite)
            .setColor(getColor(inter.member?.displayColor));

        const selectDatas = {};

        const generalEmbed = new MessageEmbed(baseEmbed)
            .setTitle(`General Info`)
            .addField("Identifier", `\`${server.name}\`\n\`${server.nameAcronym}\`\n(${server.id})`, true)
            .addField("Owner", `${tickTag(generalInfo.owner.user)}\n<@${server.ownerId}>`, true)
            .addField("Created",
                "<t:" + Math.floor(server.createdTimestamp / 1000) + ":F>\n"
                + `(${intervalToStrings(
                    Interval.fromDateTimes(
                        DateTime.fromJSDate(server.createdAt),
                        DateTime.fromJSDate(new Date())
                    )).strings.join(" ")} ago)`)
            .addField("Explicit Content Filter", "`" + server.explicitContentFilter + "`")
            .addField("Member Count", `\`${server.memberCount}\``, true)
            .addField("Channel Count", `\`${generalInfo.channelCount}\``, true)
            .addField("NSFW Level", "`" + server.nsfwLevel + "`", true)
            .addField("Verification Level", "`" + server.verificationLevel + "`", true)
            .addField("MFA Level", "`" + server.mfaLevel + "`", true)
            .addField("Boost Level", "`" + server.premiumTier + "`", true)
            .addField("Shard Id", "`" + server.shardId + "`", true);

        if (server.vanityURLCode)
            generalEmbed.addField("Vanity Code", "`" + server.vanityURLCode + "`", true);

        if (server.description)
            generalEmbed.setDescription(server.description);

        if (server.features?.length)
            generalEmbed.addField("Features", "```js\n" + server.features.join(", ") + "```");

        selectDatas.generalPage = {
            embeds: [generalEmbed]
        };

        const CTARL = [];
        for (const I in moreInfo.channelTypesCount) {
            let U;
            if (I.startsWith("GUILD_")) U = I.slice("GUILD_".length);
            CTARL.push(U || I);
        }

        let channelTypesStr = "";
        const LENGTHCTARLS = maxStringsLength(CTARL) + 1;
        for (const T in moreInfo.channelTypesCount) {
            let U;
            if (T.startsWith("GUILD_")) U = T.slice("GUILD_".length);
            channelTypesStr += `\`${(U || T).padEnd(LENGTHCTARLS, " ")}\`: \`${moreInfo.channelTypesCount[T]}\`\n`;
        }

        const moreEmbed = new MessageEmbed(baseEmbed)
            .setTitle(`More Info`)
            .addField("Channel Count",
                channelTypesStr
                + `\`${"Total".padEnd(LENGTHCTARLS, " ")}\`: \`${generalInfo.channelCount}\``
                + (
                    moreInfo.channelNsfwCount
                        ? `\n\n\`${"NSFW".padEnd(LENGTHCTARLS, " ")}\`: \`${moreInfo.channelNsfwCount}\``
                        : ""
                ), true)
            .addField("Member Count",
                `\`${"User".padEnd(15, " ")}\`: \`${moreInfo.userCount}\`\n`
                + `\`${"Bot".padEnd(15, " ")}\`: \`${moreInfo.botCount}\`\n`
                + `\`${"Total".padEnd(15, " ")}\`: \`${server.memberCount}\`\n`
                + `\`${"Maximum Member".padEnd(15, " ")}\`: \`${server.maximumMembers}\``, true)
            .addField("Emoji Count",
                `\`${"Default".padEnd(9, " ")}\`: \`${moreInfo.emojiStatic}\`\n`
                + `\`${"Animated".padEnd(9, " ")}\`: \`${moreInfo.emojiAnimated}\`\n`
                + `\`${"Total".padEnd(9, " ")}\`: \`${moreInfo.emoteCount}\``, true)
            .addField("Role Count", "`" + moreInfo.roleCount + "`", true)
            .addField("Sticker Count", "`" + moreInfo.stickerCount + "`", true)
            .addField("Boost", "`" + server.premiumSubscriptionCount + "`", true);

        if (server.afkChannelId)
            moreEmbed.addField("AFK Voice Channel", `<#${server.afkChannelId}>`, true);

        moreEmbed.addField(
            "AFK Timeout", "`" + intervalToStrings(Interval.after(new Date(), server.afkTimeout * 1000)).strings.join(" ") + "`", true
        ).addField("Notification Setting", "`" + server.defaultMessageNotifications + "`", true);

        if (server.rulesChannelId)
            moreEmbed.addField("Rules Channel", "<#" + server.rulesChannelId + ">", true);

        if (server.publicUpdatesChannelId)
            moreEmbed.addField("Discord Updates Channel", "<#" + server.publicUpdatesChannelId + ">", true);

        if (server.systemChannelId)
            moreEmbed.addField("Join Boost Channel", "<#" + server.systemChannelId + ">", true);

        if (moreInfo.systemChannelFlags.length)
            moreEmbed.addField("Join Boost Channel Settings", "```js\n" + moreInfo.systemChannelFlags.join(", ") + "```");

        if (moreInfo.invite)
            moreEmbed.addField("Invite", `**[Link](${moreInfo.invite})**`);

        selectDatas.morePage = {
            embeds: [moreEmbed]
        };

        const menuOptions = [
            {
                label: "General Info",
                value: "generalPage",
                description: "General info about the server"
            }, {
                label: "More Info",
                value: "morePage",
                description: "Show more info"
            }
        ];

        if (iconURL) {
            const iconEmbed = new MessageEmbed(baseEmbed)
                .setTitle(`Icon`)
                .setImage(iconURL);
            selectDatas.iconPage = {
                embeds: [iconEmbed]
            };
            menuOptions.push({
                label: "Icon",
                value: "iconPage",
                description: "Show server icon"
            });
        }

        if (bannerURL) {
            const bannerEmbed = new MessageEmbed(baseEmbed)
                .setTitle(`Banner`)
                .setImage(bannerURL);
            selectDatas.bannerPage = {
                embeds: [bannerEmbed]
            };
            menuOptions.push({
                label: "Banner",
                value: "bannerPage",
                description: "Show server banner"
            });
        }

        if (splashURL) {
            const splashEmbed = new MessageEmbed(baseEmbed)
                .setTitle(`Splash Invite`)
                .setImage(splashURL);
            selectDatas.splashPage = {
                embeds: [splashEmbed]
            };
            menuOptions.push({
                label: "Splash Invite",
                value: "splashPage",
                description: "Show server splash invite"
            });
        }

        if (discoverySplashURL) {
            const discoveryEmbed = new MessageEmbed(baseEmbed)
                .setTitle(`Splash Discovery`)
                .setImage(discoverySplashURL);
            selectDatas.discoveryPage = {
                embeds: [discoveryEmbed]
            };
            menuOptions.push({
                label: "Splash Discovery",
                value: "discoveryPage",
                description: "Show server splash discovery"
            });
        }

        const menu = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setPlaceholder("Browse...")
                    .addOptions(menuOptions)
                    .setMaxValues(1)
                    .setCustomId("single")
            );

        for (const page in selectDatas)
            selectDatas[page].components = [menu];

        const mes = await inter.editReply(selectDatas.generalPage);
        inter.client.createSelectMenu(mes.id, selectDatas);
        return mes;
    }
}