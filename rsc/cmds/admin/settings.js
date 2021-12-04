'use strict';

const { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu, Collection } = require("discord.js");
const { Command } = require("../../classes/Command");
const { loadDb } = require("../../database");
const { logDev } = require("../../debug");
const { getColor, findRoles, replyError } = require("../../functions");
const { intervalToStrings, createInterval, parseDuration } = require("../../util/Duration");

module.exports = class SettingsCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "settings",
            userPermissions: ["ADMINISTRATOR"],
            clientPermissions: ["VIEW_CHANNEL", "EMBED_LINKS"],
            guildOnly: true
        });
    }
    /**
     * @param {import("../../typins").ShaCommandInteraction} inter 
     */
    async run(inter) {
        const THE_GUILD = loadDb(inter.guild, `guild/${inter.guild.id}`);
        const baseEmb = new MessageEmbed()
            .setThumbnail(this.guild.iconURL({ size: 4096, format: "png", dynamic: true }))
            .setAuthor("Settings")
            .setColor(getColor(inter.user.accentColor, true, inter.member.displayColor));

        const mainSelectMenu = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId("pages")
                    .setMaxValues(1)
                    .setOptions([
                        {
                            label: "Home",
                            description: "Home page",
                            value: "homePage"
                        },
                        {
                            label: "Moderation",
                            description: "Moderation settings",
                            value: "moderationPage"
                        },
                        {
                            label: "Miscellaneous",
                            description: "Additional features settings",
                            value: "miscPage"
                        }
                    ]).setPlaceholder("Browse main pages...")
            );

        const pages = {};

        const homeEmb = new MessageEmbed(baseEmb)
            .setTitle("All in One Settings")
            .setDescription("With this interface you can configure how i should behave in the server. Feel free to explore and experiment.");

        pages.homePage = { embeds: [homeEmb], components: [mainSelectMenu] };

        const moderationEmb = new MessageEmbed(baseEmb)
            .setTitle("Moderation Settings")
            .addField("Mute", "Setting up mute role and default duration for mute")
            .addField("Ban", "Set up timed ban as default ban behavior and default purge message on ban");

        const moderationSelectmenu = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId("/pages")
                    .setMaxValues(1)
                    .setPlaceholder("Browse settings...")
                    .addOptions([
                        {
                            label: "Mute",
                            description: "Configure mute settings",
                            value: "moderationMutePage"
                        },
                        {
                            label: "Ban",
                            description: "Configure ban settings",
                            value: "moderationBanPage"
                        }
                    ])
            );

        const moderationMutePage = async () => {
            const get = await inter.guild.db.getOne("muteSettings", "Object");
            /**
             * @type {{muteRole:string, duration:number}}
             */
            const data = get?.value || {};
            const date = new Date();

            const emb = new MessageEmbed(baseEmb)
                .setTitle("Mute Settings")
                .setDescription("Set mute role and default mute duration")
                .addField("Role",
                    data.muteRole
                        ? `<@&${data.muteRole}>`
                        : "`None`"
                ).addField("Duration", "`"
                    + (data.duration
                        ? intervalToStrings(
                            createInterval(
                                date,
                                new Date(date.valueOf() + data.duration)
                            )
                        ).strings.join(" ")
                        : "Forever")
                    + "`");

            const button = new MessageActionRow()
                .addComponents([
                    new MessageButton().setCustomId("settings/set/muteRole").setStyle("PRIMARY").setLabel("Set Role"),
                    new MessageButton().setCustomId("settings/remove/muteRole").setStyle("SECONDARY").setLabel("Remove Role"),
                    new MessageButton().setCustomId("settings/set/duration/mute").setStyle("PRIMARY").setLabel("Set Duration"),
                    new MessageButton().setCustomId("settings/remove/duration/mute").setStyle("SECONDARY").setLabel("Remove Duration")
                ]);

            const components = [mainSelectMenu, moderationSelectmenu, button];
            return { embeds: [emb], components };
        }

        const moderationBanPage = async () => {
            const get = await inter.guild.db.getOne("banSettings", "Object");
            /**
             * @type {{duration:number, purge:number}}
             */
            const data = get?.value || {};
            const date = new Date();

            const emb = new MessageEmbed(baseEmb)
                .setTitle("Ban Settings")
                .setDescription("Configure timed ban and purge on ban")
                .addField("Duration", "`"
                    + (data.duration
                        ? intervalToStrings(
                            createInterval(
                                date,
                                new Date(date.valueOf() + data.duration)
                            )
                        ).strings.join(" ")
                        : "Forever")
                    + "`")
                .addField("Purge", (data.purge ? "`Up to " + data.purge + ` day${data.purge > 1 ? "s" : ""} old messages\`` : "`No`"));

            const button = new MessageActionRow()
                .addComponents([
                    new MessageButton().setCustomId("settings/set/duration/ban").setStyle("PRIMARY").setLabel("Set Duration"),
                    new MessageButton().setCustomId("settings/remove/duration/ban").setStyle("SECONDARY").setLabel("Remove Duration"),
                    new MessageButton().setCustomId("settings/set/purge/ban").setStyle("PRIMARY").setLabel("Set Purge"),
                    new MessageButton().setCustomId("settings/remove/purge/ban").setStyle("SECONDARY").setLabel("Remove Purge")
                ]);

            const components = [mainSelectMenu, moderationSelectmenu, button];
            return { embeds: [emb], components };
        }

        pages.moderationPage = { embeds: [moderationEmb], components: [mainSelectMenu, moderationSelectmenu] };
        pages.moderationMutePage = moderationMutePage;
        pages.moderationBanPage = moderationBanPage;

        const miscEmb = new MessageEmbed(baseEmb)
            .setTitle("Miscellaneous")
            .addField("Message Preview", "Enable or disable preview when member sent a link to a message");

        const miscSelectMenu = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId("/pages")
                    .setMaxValues(1)
                    .setPlaceholder("Browse settings...")
                    .addOptions([
                        {
                            label: "Message Preview",
                            description: "Enable or disable message link preview",
                            value: "miscMessagePreviewPage"
                        }
                    ])
            );

        const miscMessagePreviewPage = async () => {
            const get = await inter.guild.db.getOne("messageLinkPreviewSettings", "Object");
            /**
             * @type {{state: boolean}}
             */
            const data = get?.value || { state: true };

            const emb = new MessageEmbed(baseEmb)
                .setTitle("Message Preview Setting")
                .setDescription("Enable or disable preview when member sent a message containing link to a message. It's also moderated to prevent abuse.")
                .addField("State", data.state ? "`Enabled`" : "`Disabled`");

            const button = new MessageActionRow()
                .addComponents([
                    new MessageButton().setCustomId("settings/set/messagePreview").setStyle("PRIMARY").setLabel("Enable"),
                    new MessageButton().setCustomId("settings/remove/messagePreview").setStyle("SECONDARY").setLabel("Disable")
                ]);

            const components = [mainSelectMenu, miscSelectMenu, button];
            return { embeds: [emb], components };
        };

        pages.miscPage = { embeds: [miscEmb], components: [mainSelectMenu, miscSelectMenu] };
        pages.miscMessagePreviewPage = miscMessagePreviewPage;

        /**
         * @type {import("../../typins").ShaMessage}
         */
        const SETTING_MESSAGE = await inter.reply({ ...pages.homePage, fetchReply: true });
        this.client.createMessageInteraction(SETTING_MESSAGE.id, { TIMEOUT: 1000 * 60 * 60, PAGES: pages });

        let blockSet, blockRem;

        SETTING_MESSAGE.buttonHandler = {
            set: async (args) => {
                if (blockSet) return;
                blockSet = true;

                if (args[0] === "muteRole") {
                    const m = await SETTING_MESSAGE.channel.send("Provide role Id, mention or name to be set as mute role:");
                    const c = await m.channel.awaitMessages({ filter: (m2) => (m2.author.id === inter.user.id) && m2.content?.length, max: 1 });
                    const setMsg = c.first();
                    let errmes;
                    let role = findRoles(m.guild, setMsg.content, "i");
                    if (role instanceof Collection) {
                        const filter = role.filter(r => !r.managed && r.position < r.guild.me.roles.highest.position);
                        role = filter.first() || role.first();
                    }
                    if (role?.managed) {
                        errmes = `Role <@&${role.id}> is managed by discord and cannot be given to members!`;
                        role = null;
                    } else if (role?.position >= role?.guild.me.roles.highest.position) {
                        errmes = `Role <@&${role.id}> is in the same or higher position than me so i can't manage it!`;
                        role = null;
                    }
                    if (!role) {
                        blockSet = false;
                        return m.edit(errmes || `No role found with that name!`).then(
                            r => delMes(m, r, setMsg)
                        );
                    } else {
                        const get = await THE_GUILD.db.getOne("muteSettings", "Object");
                        const data = get?.value || {};
                        await THE_GUILD.db.set("muteSettings", "Object", { value: { muteRole: role.id, duration: data.duration } });
                        if (m.guild.me.permissionsIn(m.channel).has("MANAGE_MESSAGES"))
                            m.channel.bulkDelete([m, setMsg]).catch(logDev);
                        else m.deleted ? null : m.delete();
                        blockSet = false;
                        if (SETTING_MESSAGE.deleted) return;
                        return SETTING_MESSAGE.edit(await moderationMutePage());
                    }

                } else if (args[0] === "duration") {
                    const m = await SETTING_MESSAGE.channel.send("Provide duration. Ex `69h420m666y96mo444s`:");
                    const c = await m.channel.awaitMessages({ filter: (m2) => (m2.author.id === inter.user.id) && m2.content?.length, max: 1 });
                    const setMsg = c.first();
                    let parsed;
                    try { parsed = parseDuration(new Date(), setMsg.content); }
                    catch (e) {
                        blockSet = false;
                        logDev(e);
                        return m.edit(replyError(e)).then(
                            r => delMes(m, r, setMsg, 10000)
                        );
                    }
                    const ms = parsed.interval.toDuration().toMillis();
                    if (ms < 10000) {
                        blockSet = false;
                        return m.edit(`Duration can't be less than 10 seconds!`).then(
                            r => delMes(m, r, setMsg)
                        );
                    }

                    let p;
                    if (args[1] === "mute") {
                        const get = await THE_GUILD.db.getOne("muteSettings", "Object");
                        const data = get?.value || {};
                        await THE_GUILD.db.set("muteSettings", "Object", { value: { muteRole: data.muteRole, duration: ms } });
                        p = moderationMutePage;
                    } else if (args[1] === "ban") {
                        const get = await THE_GUILD.db.getOne("banSettings", "Object");
                        const data = get?.value || {};
                        await THE_GUILD.db.set("banSettings", "Object", { value: { duration: ms, purge: data.purge } });
                        p = moderationBanPage;
                    }

                    if (m.guild.me.permissionsIn(m.channel).has("MANAGE_MESSAGES"))
                        m.channel.bulkDelete([m, setMsg]).catch(logDev);
                    else m.deleted ? null : m.delete();
                    blockSet = false;
                    if (SETTING_MESSAGE.deleted) return;
                    return SETTING_MESSAGE.edit(await p());

                } else if (args[0] === "purge") {
                    const m = await SETTING_MESSAGE.channel.send("Provide oldest message age in days to include as number. From 1 up to 7:");
                    const c = await m.channel.awaitMessages({ filter: (m2) => (m2.author.id === inter.user.id) && m2.content?.length, max: 1 });
                    const setMsg = c.first();

                    if (/[^\d]/.test(setMsg.content)) {
                        blockSet = false;
                        return m.edit("It's NUMBER omg don't put other _thingy_!").then(
                            r => delMes(m, r, setMsg)
                        );
                    }
                    const par = parseInt(setMsg.content);
                    const purge = par > 0 ? par : null;

                    let p;
                    if (args[1] === "ban") {
                        const get = await THE_GUILD.db.getOne("banSettings", "Object");
                        const data = get?.value || {};
                        await THE_GUILD.db.set("banSettings", "Object", { value: { duration: data.duration, purge: purge > 7 ? 7 : purge } });
                        p = moderationBanPage;
                    }

                    if (m.guild.me.permissionsIn(m.channel).has("MANAGE_MESSAGES"))
                        m.channel.bulkDelete([m, setMsg]).catch(logDev);
                    else m.deleted ? null : m.delete();
                    blockSet = false;
                    if (SETTING_MESSAGE.deleted) return;
                    return SETTING_MESSAGE.edit(await p());

                } else if (args[0] === "messagePreview") {
                    SETTING_MESSAGE.guild.messageLinkPreviewSettings = { state: true };
                    await THE_GUILD.db.set("messageLinkPreviewSettings", "Object", { value: { state: true } });
                    blockSet = false;
                    if (SETTING_MESSAGE.deleted) return;
                    return SETTING_MESSAGE.edit(await miscMessagePreviewPage());
                }
            },
            remove: async (args) => {
                if (blockRem) return;
                blockRem = true;
                if (args[0] === "muteRole") {
                    const get = await THE_GUILD.db.getOne("muteSettings", "Object");
                    const set = get?.value || {};
                    await THE_GUILD.db.set("muteSettings", "Object", { value: { muteRole: null, duration: set.duration } });
                    blockRem = false;
                    if (SETTING_MESSAGE.deleted) return;
                    return SETTING_MESSAGE.edit(await moderationMutePage());
                } else if (args[0] === "duration") {

                    let p;
                    if (args[1] === "mute") {
                        const get = await THE_GUILD.db.getOne("muteSettings", "Object");
                        const set = get?.value || {};
                        await THE_GUILD.db.set("muteSettings", "Object", { value: { muteRole: set.muteRole, duration: null } });
                        p = moderationMutePage;
                    } else if (args[1] === "ban") {
                        const get = await THE_GUILD.db.getOne("banSettings", "Object");
                        const data = get?.value || {};
                        await THE_GUILD.db.set("banSettings", "Object", { value: { duration: null, purge: data.purge } });
                        p = moderationBanPage;
                    }

                    blockRem = false;
                    if (SETTING_MESSAGE.deleted) return;
                    return SETTING_MESSAGE.edit(await p());
                } else if (args[0] === "purge") {

                    let p;
                    if (args[1] === "ban") {
                        const get = await THE_GUILD.db.getOne("banSettings", "Object");
                        const data = get?.value || {};
                        await THE_GUILD.db.set("banSettings", "Object", { value: { duration: data.duration, purge: null } });
                        p = moderationBanPage;
                    }

                    blockRem = false;
                    if (SETTING_MESSAGE.deleted) return;
                    return SETTING_MESSAGE.edit(await p());

                } else if (args[0] === "messagePreview") {
                    SETTING_MESSAGE.guild.messageLinkPreviewSettings = { state: false };
                    await THE_GUILD.db.set("messageLinkPreviewSettings", "Object", { value: { state: false } });
                    blockRem = false;
                    if (SETTING_MESSAGE.deleted) return;
                    return SETTING_MESSAGE.edit(await miscMessagePreviewPage());
                }
            }
        }
        return SETTING_MESSAGE;
    }
}

function delMes(m, r, setMsg, dur) {
    setTimeout(
        () => {
            if (m.guild.me.permissionsIn(m.channel).has("MANAGE_MESSAGES"))
                m.channel.bulkDelete([r, setMsg]).catch(logDev);
            else m.deleted ? null : m.delete();
        }, dur || 5000
    )
}