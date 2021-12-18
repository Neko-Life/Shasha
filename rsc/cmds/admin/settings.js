'use strict';

const { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu, Collection } = require("discord.js");
const ArgsParser = require("../../classes/ArgsParser");
const { Command } = require("../../classes/Command");
const { CommandSettingsHelper } = require("../../classes/CommandSettingsHelper");
const { BUTTON_CLOSE } = require("../../constants");
const { loadDb } = require("../../database");
const { logDev } = require("../../debug");
const { getColor, findRoles, replyError, isInteractionInvoker } = require("../../functions");
const ButtonHandler = require("../../messageInteraction/button");
const { intervalToStrings, createInterval, parseDuration } = require("../../util/Duration");

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
                    label: "Command",
                    description: "Configure setting and permissions for each command",
                    value: "commandPage"
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

const closeRow = new MessageActionRow().addComponents(BUTTON_CLOSE);

const moderationMutePageButtons = new MessageActionRow()
    .addComponents([
        new MessageButton().setCustomId("settings/set/muteRole").setStyle("PRIMARY").setLabel("Set Role"),
        new MessageButton().setCustomId("settings/set/duration/mute").setStyle("PRIMARY").setLabel("Set Duration"),
        new MessageButton().setCustomId("settings/remove/muteRole").setStyle("SECONDARY").setLabel("Remove Role"),
        new MessageButton().setCustomId("settings/remove/duration/mute").setStyle("SECONDARY").setLabel("Remove Duration")
    ]);

const moderationBanPageButtons = new MessageActionRow()
    .addComponents([
        new MessageButton().setCustomId("settings/set/duration/ban").setStyle("PRIMARY").setLabel("Set Duration"),
        new MessageButton().setCustomId("settings/set/purge/ban").setStyle("PRIMARY").setLabel("Set Purge"),
        new MessageButton().setCustomId("settings/remove/duration/ban").setStyle("SECONDARY").setLabel("Remove Duration"),
        new MessageButton().setCustomId("settings/remove/purge/ban").setStyle("SECONDARY").setLabel("Remove Purge")
    ]);


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

const miscMessagePreviewPageButtons = new MessageActionRow()
    .addComponents([
        new MessageButton().setCustomId("settings/set/messagePreview").setStyle("PRIMARY").setLabel("Enable"),
        new MessageButton().setCustomId("settings/remove/messagePreview").setStyle("SECONDARY").setLabel("Disable")
    ]);

const commandPagesPageButtons = new MessageActionRow()
    .addComponents([
        new MessageButton().setCustomId(`settings/command/page/prev`).setLabel("⬅️").setStyle("PRIMARY"),
        new MessageButton().setCustomId(`settings/command/page/home`).setLabel("🏠").setStyle("PRIMARY"),
        new MessageButton().setCustomId(`settings/command/page/next`).setLabel("➡️").setStyle("PRIMARY"),
    ]);

module.exports = class SettingsCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "settings",
            userPermissions: ["ADMINISTRATOR"],
            clientPermissions: ["VIEW_CHANNEL", "EMBED_LINKS"],
            guildOnly: true,
            guarded: true
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

        const pages = {};

        const homeEmb = new MessageEmbed(baseEmb)
            .setTitle("All in One Settings")
            .setDescription("With this interface you can configure how i should behave in the server. Feel free to explore and experiment.");

        pages.homePage = { embeds: [homeEmb], components: [mainSelectMenu, closeRow] };

        const moderationEmb = new MessageEmbed(baseEmb)
            .setTitle("Moderation Settings")
            .addField("Mute", "Setting up mute role and default duration for mute")
            .addField("Ban", "Set up timed ban as default ban behavior and default purge message on ban");

        const moderationMutePage = async (inter) => {
            if (inter && !(inter.deferred || inter.replied)) await inter.deferUpdate();
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

            const components = [mainSelectMenu, moderationSelectmenu, moderationMutePageButtons];
            return { embeds: [emb], components };
        }

        const moderationBanPage = async (inter) => {
            if (inter && !(inter.deferred || inter.replied)) await inter.deferUpdate();
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

            const components = [mainSelectMenu, moderationSelectmenu, moderationBanPageButtons];
            return { embeds: [emb], components };
        }

        pages.moderationPage = { embeds: [moderationEmb], components: [mainSelectMenu, moderationSelectmenu] };
        pages.moderationMutePage = moderationMutePage;
        pages.moderationBanPage = moderationBanPage;

        const miscEmb = new MessageEmbed(baseEmb)
            .setTitle("Miscellaneous")
            .addField("Message Preview", "Enable or disable preview when member sent a link to a message");

        const miscMessagePreviewPage = async (inter) => {
            if (inter && !(inter.deferred || inter.replied)) await inter.deferUpdate();
            const get = await inter.guild.db.getOne("messageLinkPreviewSettings", "Object");
            /**
             * @type {{state: boolean}}
             */
            const data = get?.value || { state: true };

            const emb = new MessageEmbed(baseEmb)
                .setTitle("Message Preview Setting")
                .setDescription("Enable or disable preview when member sent a message containing link to a message. It's also moderated to prevent abuse")
                .addField("State", data.state ? "`Enabled`" : "`Disabled`");

            const components = [mainSelectMenu, miscSelectMenu, miscMessagePreviewPageButtons];
            return { embeds: [emb], components };
        };

        pages.miscPage = { embeds: [miscEmb], components: [mainSelectMenu, miscSelectMenu] };
        pages.miscMessagePreviewPage = miscMessagePreviewPage;

        const cmdsFetch = this.client.application.commands.cache.size
            ? this.client.application.commands.cache
            : await this.client.application.commands.fetch();

        const commandPages = [];
        let curCommandPage = 0;

        pages.commandPage = async (inter, args = []) => {
            if (inter && !isInteractionInvoker(inter)) {
                const ret = await inter.reply({ content: "Watchu wanna do? hmm <:SuiseiThinkLife:772716901834686475>", fetchReply: true });
                delMes(ret, null, 5000);
                return;
            }
            if (!args.length) {
                const baseCommandEmb = new MessageEmbed(baseEmb)
                    .setTitle("Command")
                    .setDescription("Edit command permissions");

                const useFetch = cmdsFetch.map(r => r).filter(r => r.name !== "owner");
                for (let i = 0; i < useFetch.length; i = i + 4) {
                    const nU = i + 4;
                    commandPages[commandPages.length] = async (inter) => {
                        const commandEmb = new MessageEmbed(baseCommandEmb);
                        const commandSelectMenuOpts = [];
                        let waitMes;

                        for (let nI = i; nI < nU; nI++) {
                            if (!useFetch[nI]) break;
                            const v = useFetch[nI];
                            if (!this.guild.commandPermissions?.[v.id]) {
                                if (!waitMes && inter && !(inter.replied || inter.deferred))
                                    waitMes = await inter.reply({ content: "Fetching permissions settings. Please wait...", fetchReply: true });
                                if (!this.guild.commandPermissions)
                                    this.guild.commandPermissions = {};
                                this.guild.commandPermissions[v.id] = await v.permissions.fetch({ guild: this.guild }).catch(logDev) || [];
                            }
                            const perms = this.guild.commandPermissions[v.id];
                            const findEveryone = perms?.find(r => r.id === this.guild.id)?.permission;
                            const everyonePerm = typeof findEveryone === "boolean" ? findEveryone : v.defaultPermission;

                            const bypassRoles = perms?.filter(r => r.type === "ROLE" && r.permission === true);
                            const bypassUsers = perms?.filter(r => r.type === "USER" && r.permission === true);

                            commandEmb.addField(
                                v.name.toUpperCase(),
                                v.description + "\n\n**" + (everyonePerm ? "Enabled" : "Disabled") + `** (this category/command is ${v.defaultPermission ? "enabled" : "disabled"} by default)`
                                + (
                                    bypassRoles?.length ? `\nBypass Roles: <@&${bypassRoles.map(r => r.id).join(">, <@&")}>`.replace(`<@&${this.guild.id}>`, "@everyone") : ""
                                ) + (
                                    bypassUsers?.length ? `\nBypass Users: <@${bypassUsers.map(r => r.id).join(">, <@")}>` : ""
                                )
                            );
                            commandSelectMenuOpts.push(
                                {
                                    label: v.name.toUpperCase(),
                                    description: `Edit \`${v.name}\` category/command`,
                                    value: `commandPage/${v.id}`
                                }
                            );
                        }
                        if (inter && !(inter.replied || inter.deferred))
                            inter.deferUpdate();

                        const row = new MessageActionRow()
                            .addComponents(
                                new MessageSelectMenu()
                                    .setCustomId("/pages")
                                    .setMaxValues(1)
                                    .setPlaceholder("Settings category/command...")
                                    .addOptions(commandSelectMenuOpts)
                            );
                        if (waitMes && waitMes.deleted === false)
                            waitMes.delete();
                        return { embeds: [commandEmb], components: [mainSelectMenu, row, commandPagesPageButtons] };
                    }
                }
                return commandPages[curCommandPage](inter);
            } else {
                const cmd = cmdsFetch.get(args[0]);
                const emb = new MessageEmbed(baseEmb)
                    .setTitle(cmd.name.toUpperCase())
                    .setDescription(cmd.description + `\n\nThis category/command is ${cmd.defaultPermission ? "enabled" : "disabled"} for everyone by default`);
                for (const k of cmd.options) {
                    if (!["SUB_COMMAND_GROUP", "SUB_COMMAND"].includes(k.type)) continue;
                    if (k.type === "SUB_COMMAND_GROUP") {
                        let desc = "";
                        for (const i of k.options) {
                            if (i.type !== "SUB_COMMAND") continue;
                            desc += `**${i.type}:\`${i.name}\`:\n${i.description}\n\n`;
                        }
                        emb.addField(`${k.type}:\`${k.name}\``, desc.trim());
                    } else emb.addField(`${k.type}:\`${k.name}\``, k.description);
                }
                const lastRowButtons = [BUTTON_CLOSE,];
                if (emb.fields.length) {
                    lastRowButtons.push(
                        new MessageButton().setCustomId(`settings/command/subCommand/${cmd.name}`).setLabel("Sub-Command Settings").setStyle("PRIMARY")
                    );
                }
                const buttons = [
                    new MessageActionRow().addComponents([
                        new MessageButton().setCustomId(`settings/command/enable/category/${cmd.id}`).setLabel("Enable").setStyle("PRIMARY"),
                        new MessageButton().setCustomId(`settings/command/set/bypassRoles/${cmd.id}`).setLabel("Set Bypass Roles").setStyle("PRIMARY"),
                        new MessageButton().setCustomId(`settings/command/set/bypassUsers/${cmd.id}`).setLabel("Set Bypass Users").setStyle("PRIMARY"),
                    ]),
                    new MessageActionRow().addComponents([
                        new MessageButton().setCustomId(`settings/command/disable/category/${cmd.id}`).setLabel("Disable").setStyle("SECONDARY"),
                        new MessageButton().setCustomId(`settings/command/remove/bypass/${cmd.id}`).setLabel("Remove Bypasses").setStyle("SECONDARY"),
                    ]),
                    new MessageActionRow().addComponents(lastRowButtons),
                ];
                const send = { embeds: [emb], components: buttons, fetchReply: true };
                if (!(inter.deferred || inter.replied)) {
                    const mes = await inter.reply(send);
                    const buttonHandler = {
                        set: async (inter, args) => {
                            if (args[0] === "channels") {
                                /** @type {import("../../typins").ShaMessage} */
                                const prompt = await inter.reply({ content: "Provide every channel's Id, name or mention where you want this sub-command to be disabled in, you can provide `all` to disable it for the whole server:", fetchReply: true });
                                const collect = await this.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                                const got = collect.first();

                                const opts = {};
                                let tm = 0;
                                if (/(?:\s|^)all(?:\s|$)/.test(got.content)) {
                                    opts.all = true;
                                    opts.channels = [];
                                } else {
                                    const parsed = await ArgsParser.channels(this.guild, got.content.replace(/(?:\s|^)here(?:\s|$)/, " " + this.channel.id + " "));
                                    if (parsed.unknown.length) {
                                        prompt.edit({ content: `Unknown channels: ${parsed.unknown.join(", ")}`, allowedMentions: { parse: [] } });
                                        tm = 5000;
                                    }
                                    opts.channels = parsed.channels.map(r => r.id);
                                    opts.all = false;
                                }
                                const commandPath = args.slice(1).join("/");
                                const gd = loadDb(this.guild, "guild/" + this.guild.id);
                                const get = await gd.db.getOne("commandDisabled", commandPath);
                                const setting = get?.value || { bypass: {} };
                                await gd.db.set("commandDisabled", commandPath, { value: { ...setting, ...opts } });
                                delMes(prompt, got, tm);
                                if (inter.message.deleted) return;
                                return inter.message.edit(await inter.message.getPage());
                            } else if (args[0] === "bypass") {
                                args = args.slice(1);
                                if (args[0] === "roles") {
                                    const prompt = await inter.reply({ content: "Provide role's Id, name or mention to bypass:", fetchReply: true });
                                    const collect = await this.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                                    const got = collect.first();
                                    const parsed = await ArgsParser.roles(this.guild, got.content);
                                    let tm = 0;
                                    if (parsed.unknown.length) {
                                        prompt.edit({ content: `Unknown roles: ${parsed.unknown.join(", ")}`, allowedMentions: { parse: [] } });
                                        tm = 5000;
                                    }
                                    const bypass = { roles: parsed.roles.map(r => r.id) };
                                    const commandPath = args.slice(1).join("/");
                                    const gd = loadDb(this.guild, "guild/" + this.guild.id);
                                    const get = await gd.db.getOne("commandDisabled", commandPath);
                                    const setting = get?.value || { bypass: {} };
                                    await gd.db.set("commandDisabled", commandPath, { value: { ...setting, bypass: { ...setting.bypass, ...bypass } } });
                                    delMes(prompt, got, tm);
                                    if (inter.message.deleted) return;
                                    return inter.message.edit(await inter.message.getPage());

                                } else if (args[0] === "users") {
                                    const prompt = await inter.reply({ content: "Provide user's Id, name or mention to bypass:", fetchReply: true });
                                    const collect = await this.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                                    const got = collect.first();
                                    const parsed = await ArgsParser.users(this.guild, got.content);
                                    let tm = 0;
                                    if (parsed.unknown.length) {
                                        prompt.edit({ content: `Unknown users: ${parsed.unknown.join(", ")}`, allowedMentions: { parse: [] } });
                                        tm = 5000;
                                    }
                                    const bypass = { users: parsed.users.map(r => r.id) };
                                    const commandPath = args.slice(1).join("/");
                                    const gd = loadDb(this.guild, "guild/" + this.guild.id);
                                    const get = await gd.db.getOne("commandDisabled", commandPath);
                                    const setting = get?.value || { bypass: {} };
                                    await gd.db.set("commandDisabled", commandPath, { value: { ...setting, bypass: { ...setting.bypass, ...bypass } } });
                                    delMes(prompt, got, tm);
                                    if (inter.message.deleted) return;
                                    return inter.message.edit(await inter.message.getPage());
                                } else if (args[0] === "permissions") {
                                    const prompt = await inter.reply({ content: "Provide permissions to bypass:", fetchReply: true });
                                    const collect = await this.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                                    const got = collect.first();
                                    const parsed = ArgsParser.permissions(got.content);
                                    let tm = 0;
                                    if (parsed.noMatch.length) {
                                        prompt.edit({ content: `Unknown permissions: ${parsed.noMatch.join(", ")}`, allowedMentions: { parse: [] } });
                                        tm = 5000;
                                    }
                                    const bypass = { permissions: parsed.perms };
                                    const commandPath = args.slice(1).join("/");
                                    const gd = loadDb(this.guild, "guild/" + this.guild.id);
                                    const get = await gd.db.getOne("commandDisabled", commandPath);
                                    const setting = get?.value || { bypass: {} };
                                    await gd.db.set("commandDisabled", commandPath, { value: { ...setting, bypass: { ...setting.bypass, ...bypass } } });
                                    delMes(prompt, got, tm);
                                    if (inter.message.deleted) return;
                                    return inter.message.edit(await inter.message.getPage());
                                }
                            }
                            const res = await inter.reply({ content: "This feature is still in development and isn't ready yet. We're sorry for the incovenience", fetchReply: true });
                            delMes(res);
                        },
                        reset: async (inter, args) => {
                            inter.deferUpdate();
                            const gd = loadDb(this.guild, "guild/" + this.guild.id);
                            await gd.db.delete("commandDisabled", args.join("/"));
                            return inter.message.edit(await inter.message.getPage());
                        },
                        close: async (inter) => {
                            if (inter.message.deleted) return;
                            inter.message.delete();
                        }
                    };
                    mes.buttonHandler = buttonHandler;
                    mes.interaction = inter;
                } else return send;
            }
        }

        /**
         * @type {import("../../typins").ShaMessage}
         */
        const SETTING_MESSAGE = await inter.reply({ ...pages.homePage, fetchReply: true });
        this.client.createMessageInteraction(SETTING_MESSAGE.id, { TIMEOUT: 1000 * 60 * 60, PAGES: pages });

        let blockSet, blockRem, blockCom;
        const buttonHandler = {
            set: async (inter, args) => {
                if (blockSet) return inter.deferUpdate();
                blockSet = true;

                if (args[0] === "muteRole") {
                    const m = await inter.reply({ content: "Provide role's Id, mention or name to be set as mute role:", fetchReply: true });
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
                            r => delMes(m, setMsg)
                        );
                    } else {
                        const get = await THE_GUILD.db.getOne("muteSettings", "Object");
                        const data = get?.value || {};
                        await THE_GUILD.db.set("muteSettings", "Object", { value: { muteRole: role.id, duration: data.duration } });
                        if (m.guild.me.permissionsIn(m.channel).has("MANAGE_MESSAGES"))
                            m.channel.bulkDelete([m, setMsg]).catch(logDev);
                        else m.deleted ? null : m.delete();
                        blockSet = false;
                        if (SETTING_MESSAGE && SETTING_MESSAGE.deleted) return;
                        return SETTING_MESSAGE.edit(await moderationMutePage(inter));
                    }

                } else if (args[0] === "duration") {
                    const m = await inter.reply({ content: "Provide duration. Ex `69h420m666y96mo444s`:", fetchReply: true });
                    const c = await m.channel.awaitMessages({ filter: (m2) => (m2.author.id === inter.user.id) && m2.content?.length, max: 1 });
                    const setMsg = c.first();
                    let parsed;
                    try { parsed = parseDuration(new Date(), setMsg.content); }
                    catch (e) {
                        blockSet = false;
                        logDev(e);
                        return m.edit(replyError(e)).then(
                            r => delMes(m, setMsg, 10000)
                        );
                    }
                    const ms = parsed.interval.toDuration().toMillis();
                    if (ms < 10000) {
                        blockSet = false;
                        return m.edit(`Duration can't be less than 10 seconds!`).then(
                            r => delMes(m, setMsg)
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
                    if (SETTING_MESSAGE && SETTING_MESSAGE.deleted) return;
                    return SETTING_MESSAGE.edit(await p(inter));

                } else if (args[0] === "purge") {
                    const m = await inter.reply({ content: "Provide oldest message's age in days to include as number. From 1 up to 7:", fetchReply: true });
                    const c = await m.channel.awaitMessages({ filter: (m2) => (m2.author.id === inter.user.id) && m2.content?.length, max: 1 });
                    const setMsg = c.first();

                    if (/[^\d]/.test(setMsg.content)) {
                        blockSet = false;
                        return m.edit("It's NUMBER omg don't put other _thingy_!").then(
                            r => delMes(m, setMsg)
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
                    if (SETTING_MESSAGE && SETTING_MESSAGE.deleted) return;
                    return SETTING_MESSAGE.edit(await p(inter));

                } else if (args[0] === "messagePreview") {
                    SETTING_MESSAGE.guild.messageLinkPreviewSettings = { state: true };
                    await THE_GUILD.db.set("messageLinkPreviewSettings", "Object", { value: { state: true } });
                    blockSet = false;
                    if (SETTING_MESSAGE && SETTING_MESSAGE.deleted) return;
                    return SETTING_MESSAGE.edit(await miscMessagePreviewPage(inter));
                }
            },
            remove: async (inter, args) => {
                if (blockRem) return;
                blockRem = true;
                if (args[0] === "muteRole") {
                    const get = await THE_GUILD.db.getOne("muteSettings", "Object");
                    const set = get?.value || {};
                    await THE_GUILD.db.set("muteSettings", "Object", { value: { muteRole: null, duration: set.duration } });
                    blockRem = false;
                    if (SETTING_MESSAGE && SETTING_MESSAGE.deleted) return;
                    return SETTING_MESSAGE.edit(await moderationMutePage(inter));
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
                    if (SETTING_MESSAGE && SETTING_MESSAGE.deleted) return;
                    return SETTING_MESSAGE.edit(await p(inter));
                } else if (args[0] === "purge") {

                    let p;
                    if (args[1] === "ban") {
                        const get = await THE_GUILD.db.getOne("banSettings", "Object");
                        const data = get?.value || {};
                        await THE_GUILD.db.set("banSettings", "Object", { value: { duration: data.duration, purge: null } });
                        p = moderationBanPage;
                    }

                    blockRem = false;
                    if (SETTING_MESSAGE && SETTING_MESSAGE.deleted) return;
                    return SETTING_MESSAGE.edit(await p(inter));

                } else if (args[0] === "messagePreview") {
                    SETTING_MESSAGE.guild.messageLinkPreviewSettings = { state: false };
                    await THE_GUILD.db.set("messageLinkPreviewSettings", "Object", { value: { state: false } });
                    blockRem = false;
                    if (SETTING_MESSAGE && SETTING_MESSAGE.deleted) return;
                    return SETTING_MESSAGE.edit(await miscMessagePreviewPage(inter));
                }
            },
            command: async (inter, args) => {
                if (args[0] === "page") {
                    const key = args.pop();
                    const nP = ButtonHandler.getNewPage(key, curCommandPage, commandPages.length);
                    if (SETTING_MESSAGE && SETTING_MESSAGE.deleted) return;
                    curCommandPage = nP;
                    return SETTING_MESSAGE.edit(await commandPages[nP](inter));
                }
                if (blockCom) return inter.deferUpdate();
                blockCom = true;
                try {
                    const update = await CommandSettingsHelper[args[0]](inter, args.slice(1));
                    blockCom = false;
                    if (SETTING_MESSAGE && SETTING_MESSAGE.deleted) return;
                    if (update) return SETTING_MESSAGE.edit(await pages.commandPage(inter));
                } catch (e) {
                    logDev(e);
                    const mes = replyError(e);
                    blockCom = false;
                    if (inter.deferred || inter.replied)
                        return inter.editReply(mes);
                    else return inter.reply(mes);
                }
            }
        }
        SETTING_MESSAGE.buttonHandler = buttonHandler;
        setTimeout(() => delete SETTING_MESSAGE.buttonHandler, 60 * 60 * 1000);
        return SETTING_MESSAGE;
    }
}

function delMes(m, setMsg, dur = 5000) {
    setTimeout(
        () => {
            if (setMsg && m.guild.me.permissionsIn(m.channel).has("MANAGE_MESSAGES"))
                m.channel.bulkDelete([m, setMsg]).catch(logDev);
            else m.deleted ? null : m.delete();
        }, dur
    )
}