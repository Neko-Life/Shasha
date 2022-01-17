'use strict';

const { MessageSelectMenu, MessageActionRow, MessageEmbed, Guild } = require("discord.js");
const { Interval } = require("luxon");
const { Command } = require("../../classes/Command");
const { fetchAllMembers, tickTag, maxStringsLength, getCommunityInvite } = require("../../functions");
const { getColor } = require("../../functions");
const { intervalToStrings, createInterval } = require("../../util/Duration");

module.exports = class ServerInfoCmd extends Command {
    constructor(interaction) {
        const tocommands = {
            identifier: {}
        }
        const mutual = interaction.client?.findMutualGuilds(interaction.user) || [];
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
    async run(inter, { identifier, force }) {
        if (!inter.guild && !identifier) {
            const ret = inter.reply("What server to show info about?");
            ret.deleteAfter = 10000;
            return this.saveMessages(ret);
        }
        await inter.deferReply();
        /**
         * @type {Guild}
         */
        let server = inter.guild;
        if (identifier) server = this.client.findGuilds(
            identifier.value, "i",
            this.isOwner,
            true
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
            invite: (await getCommunityInvite(server, force))?.url
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
            .setAuthor({ name: server.name, iconURL, url: moreInfo.invite })
            .setColor(getColor(inter.member?.displayColor));

        const selectDatas = {};

        const generalEmbed = new MessageEmbed(baseEmbed)
            .setTitle(`General Info`)
            .addField("Identifier", `\`${server.name}\`\n\`${server.nameAcronym}\`\n(${server.id})`, true)
            .addField("Owner", `${tickTag(generalInfo.owner.user)}\n<@${server.ownerId}>`, true)
            .addField("Created",
                "<t:" + Math.floor(server.createdTimestamp / 1000) + ":F>\n"
                + `(${intervalToStrings(
                    createInterval(server.createdAt, new Date())
                ).strings.join(" ")} ago)`)
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
                `\`${"User".padEnd(11, " ")}\`: \`${moreInfo.userCount}\`\n`
                + `\`${"Bot".padEnd(11, " ")}\`: \`${moreInfo.botCount}\`\n`
                + `\`${"Total".padEnd(11, " ")}\`: \`${server.memberCount}\`\n`
                + `\`${"Max Member".padEnd(11, " ")}\`: \`${server.maximumMembers}\``, true)
            .addField("Members Client",
                `\`${"PC".padEnd(7, " ")}\`: \`${server.members.cache.filter(r => r.presence?.clientStatus.desktop).size}\`\n`
                + `\`${"WEB".padEnd(7, " ")}\`: \`${server.members.cache.filter(r => r.presence?.clientStatus.web).size}\`\n`
                + `\`${"MOBILE".padEnd(7, " ")}\`: \`${server.members.cache.filter(r => r.presence?.clientStatus.mobile).size}\``, true)
            .addField("Members Status",
                `\`${"ONLINE".padEnd(13, " ")}\`: \`${server.members.cache.filter(r => r.presence?.status === "online").size}\`\n`
                + `\`${"IDLE".padEnd(13, " ")}\`: \`${server.members.cache.filter(r => r.presence?.status === "idle").size}\`\n`
                + `\`${"DND".padEnd(13, " ")}\`: \`${server.members.cache.filter(r => r.presence?.status === "dnd").size}\`\n`
                + `\`${"OFFLINE".padEnd(13, " ")}\`: \`${server.members.cache.filter(r => !r.presence || r.presence.status === "invisible" || r.presence.status === "offline").size}\`\n\n`

                + `\`${"IN_VC".padEnd(13, " ")}\`: \`${server.members.cache.filter(r => r.voice.channel).size}\`\n`
                + `\`${"VC_STREAM".padEnd(13, " ")}\`: \`${server.members.cache.filter(r => r.voice.streaming).size}\`\n`
                + `\`${"OTHER_STREAM".padEnd(13, " ")}\`: \`${server.members.cache.filter(r => r.presence?.activities.some(r => r.type === "STREAMING")).size}\``
                , true)
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
                    .setCustomId("pages")
            );

        for (const page in selectDatas)
            selectDatas[page].components = [menu];

        const mes = await inter.editReply(selectDatas.generalPage);
        this.client.createMessageInteraction(mes.id, { PAGES: selectDatas });
        return mes;
    }
}