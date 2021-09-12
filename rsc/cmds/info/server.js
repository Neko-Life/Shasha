'use strict';

const { MessageSelectMenu, MessageActionRow, MessageEmbed, Guild } = require("discord.js");
const { Interval, DateTime } = require("luxon");
const { Command } = require("../../classes/Command");
const { findGuilds, isOwner, fetchAllMembers, tickTag, maxLengthPad } = require("../../functions");
const getColor = require("../../getColor");
const { intervalToStrings } = require("../../rsc/Duration");

module.exports = class ServerInfoCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "server-info",
            clientPermissions: ["EMBED_LINKS"]
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
        if (identifier) server = await findGuilds(
            inter.client, identifier.value, "i",
            isOwner(inter.client, inter.user.id)
        );
        if (server instanceof Map) server = server.first();
        if (!server) return inter.editReply("Can't find that server :c");
        if (!server.available) server = await server.fetch();
        if (!server.available) return inter.editReply("Unavailable at the moment...");
        await fetchAllMembers(server);
        const generalInfo = {
            channelCount: server.channels.cache.size,
            owner: server.members.cache.get(server.ownerId)
        }
        const moreInfo = {
            channelTypesCount: {},
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
            invite: server.features.includes("COMMUNITY") && server.rulesChannel
                ? (await server.invites.fetch({ channelId: server.rulesChannel.id }).catch(() => { }))
                    ?.filter(
                        r => r.inviter.id === inter.client.user.id
                    )?.first()?.url
                || (await server.invites.create(server.rulesChannel).catch(() => { }))?.url
                : null
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

        const menu = new MessageActionRow()
            .addComponents(new MessageSelectMenu()
                .setPlaceholder("Browse...")
                .addOptions([
                    {
                        label: "General Info",
                        value: "generalPage",
                        description: "General info about the server"
                    }, {
                        label: "More Info",
                        value: "morePage",
                        description: "Show more info"
                    }, {
                        label: "Icon",
                        value: "iconPage",
                        description: "Show server icon"
                    }, {
                        label: "Banner",
                        value: "bannerPage",
                        description: "Show server banner"
                    }, {
                        label: "Splash Invite",
                        value: "splashPage",
                        description: "Show server splash invite"
                    }, {
                        label: "Splash Discovery",
                        value: "discoveryPage",
                        description: "Show server splash discovery"
                    }
                ])
                .setMaxValues(1)
                .setCustomId("info/server"));

        const emb = new MessageEmbed()
            .setColor(getColor(inter.member?.displayColor));

        const generalEmbed = new MessageEmbed(emb)
            .setThumbnail(iconURL)
            .setTitle(`About **${server.name}**`)
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

        const CTARL = [];
        for (const I in moreInfo.channelTypesCount) {
            let U;
            if (I.startsWith("GUILD_")) U = I.slice("GUILD_".length);
            CTARL.push(U || I);
        }

        let channelTypesStr = "";
        const LENGTHCTARLS = maxLengthPad(CTARL) + 1;
        for (const T in moreInfo.channelTypesCount) {
            channelTypesStr += `\`${T.padEnd(LENGTHCTARLS, " ")}\`: \`${moreInfo.channelTypesCount[T]}\`\n`;
        }

        const moreEmbed = new MessageEmbed(emb)
            .setTitle(`More About **${server.name}**`)
            .addField("Channel Count",
                channelTypesStr
                + `\`${"Total".padEnd(LENGTHCTARLS, " ")}\`: \`${generalInfo.channelCount}\``, true)
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

        if (server.afkChannelID)
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
            moreEmbed.addField("Invite", `[**Join this server**](${moreInfo.invite})`);

        const bannerEmbed = new MessageEmbed(emb);
        if (bannerURL) bannerEmbed.setImage(bannerURL)
        else bannerEmbed.setTitle("No Banner for this server yet...");

        const discoveryEmbed = new MessageEmbed(emb);
        if (discoverySplashURL) discoveryEmbed.setImage(discoverySplashURL);
        else discoveryEmbed.setTitle("No Splash Discovery for this server yet...");

        const splashEmbed = new MessageEmbed(emb);
        if (splashURL) splashEmbed.setImage(splashURL);
        else splashEmbed.setTitle("No Splash Invite for this server yet...");

        const iconEmbed = new MessageEmbed(emb);
        if (iconURL) iconEmbed.setImage(iconURL);
        else iconEmbed.setTitle("No Icon for this server yet...");

        const mes = await inter.editReply({ embeds: [generalEmbed], components: [menu] });
        inter.client.activeSelectMenus.set(mes.id, {
            generalPage: {
                embeds: [generalEmbed],
                components: [menu]
            },
            morePage: {
                embeds: [moreEmbed],
                components: [menu]
            },
            iconPage: {
                embeds: [iconEmbed],
                components: [menu]
            },
            bannerPage: {
                embeds: [bannerEmbed],
                components: [menu]
            },
            splashPage: {
                embeds: [splashEmbed],
                components: [menu]
            },
            discoveryPage: {
                embeds: [discoveryEmbed],
                components: [menu]
            }
        });
    }
}