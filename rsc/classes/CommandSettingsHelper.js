'use strict';

const { ButtonInteraction, Collection, MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const ArgsParser = require("./ArgsParser");
const { logDev } = require("../debug");
const { loadDb } = require("../database");
const { getColor, emphasizePerms } = require("../functions");

class CommandSettingsHelper {
    static async close(inter) {
        inter.message.delete();
    }

    static async enable(inter, args) {
        if (args[0] === "category") {
            inter.deferUpdate();
            return this.categoryEveryonePermissionsUpdate(inter, args[1], true);
        } else {
            const res = await inter.reply({ content: "This feature is still in development and isn't ready yet. We're sorry for the incovenience", fetchReply: true });
            purgeRet(res);
        }
    }

    /**
     * 
     * @param {ButtonInteraction} inter 
     * @param {*} args 
     */
    static async disable(inter, args) {
        if (args[0] === "category") {
            inter.deferUpdate();
            return this.categoryEveryonePermissionsUpdate(inter, args[1], false);
        } else {
            const res = await inter.reply({ content: "This feature is still in development and isn't ready yet. We're sorry for the incovenience", fetchReply: true });
            purgeRet(res);
        }
    }

    /**
     * 
     * @param {ButtonInteraction} inter 
     * @param {*} args 
     */
    static async subCommand(inter, args) {
        const category = inter.client.commands[args[0]];
        const buttons = [];
        for (const k in category) {
            buttons.push(
                new MessageButton()
                    .setStyle("PRIMARY")
                    .setCustomId(k)
                    .setLabel(k)
            );
        }
        const rows = [];
        let row = new MessageActionRow();
        for (let i = 0; i < buttons.length; i = i + 5) {
            row.addComponents(buttons.slice(i, i + 5));
            rows.push(row);
            row = new MessageActionRow();
        }
        /** @type {import("../typins").ShaMessage} */
        const prompt = await inter.reply({ content: "Pick the sub-command you wanna set up:", fetchReply: true, components: rows });
        const collect = await prompt.awaitMessageComponent({ componentType: "BUTTON", filter: (r) => r.user.id === inter.user.id });
        collect.deferUpdate();
        const secondPath = collect.customId;

        // const cmd = category[secondPath];
        // if (!cmd) {
        //     inter.editReply("No sub-command exist with that name <:bruhLife:798789686242967554>");
        //     purgeRet(prompt, got);
        //     return;
        // }
        // if (got.deletable) got.delete();
        // const cmdInstance = new cmd({ guild: inter.guild, commandPath: [args[0], secondPath] });
        prompt.getPage = async () => {
            const gd = loadDb(inter.guild, "guild/" + inter.guild.id);
            const get = await gd.db.getOne("commandDisabled", [args[0], secondPath].join("/"));
            const settings = get?.value;

            const emb = new MessageEmbed()
                .setTitle("SUB_COMMAND:`" + secondPath + "`")
                .setAuthor("Settings")
                .setDescription("**" + (settings?.all ? "Disabled" : "Enabled") + "**"
                    + (settings?.all ? "\nThis command can't be used anywhere in the server" : ""))
                .setColor(getColor(inter.user.accentColor, true, inter.member?.displayColor))
                .setThumbnail(inter.guild.iconURL({ size: 4096, format: "png", dynamic: true }));
            if (settings) {
                if (settings.channels?.length)
                    emb.addField("Disabled in", "<#" + settings.channels.join(">, <#") + ">");
                if (settings.bypass.roles?.length)
                    emb.addField("Bypass roles",
                        ("<@&" + settings.bypass.roles.join(">, <@&") + ">")
                            .replace(new RegExp("<@&" + inter.guildId + ">"), "@everyone"));
                if (settings.bypass.users?.length)
                    emb.addField("Bypass users", "<@" + settings.bypass.users.join(">, <@") + ">");
                if (settings.bypass.permissions?.length) {
                    const use = [];
                    for (const k of settings.bypass.permissions)
                        use.push(emphasizePerms(k));
                    emb.addField("Bypass permissions", "```js\n" + use.join(", ") + "```");
                }
            }
            const rows2 = [
                new MessageActionRow()
                    .addComponents([
                        new MessageButton().setCustomId(`settings/set/channels/${args[0]}/${secondPath}`).setLabel("Set Channel Disables").setStyle("PRIMARY"),
                        new MessageButton().setCustomId(`settings/set/bypass/roles/${args[0]}/${secondPath}`).setLabel("Set Bypass Roles").setStyle("PRIMARY"),
                        new MessageButton().setCustomId(`settings/set/bypass/users/${args[0]}/${secondPath}`).setLabel("Set Bypass Users").setStyle("PRIMARY"),
                        new MessageButton().setCustomId(`settings/set/bypass/permissions/${args[0]}/${secondPath}`).setLabel("Set Bypass Permissions").setStyle("PRIMARY"),
                    ]),
                new MessageActionRow()
                    .addComponents([
                        new MessageButton().setCustomId(`settings/reset/${args[0]}/${secondPath}`).setLabel("Reset").setStyle("DANGER"),
                        new MessageButton().setCustomId(`settings/close`).setLabel("Done").setStyle("SUCCESS"),
                    ]),
            ];
            return { content: null, embeds: [emb], components: rows2 };
        }
        prompt.edit(await prompt.getPage());
        // const res = await inter.channel.send({ content: "This feature is still in development and isn't ready yet. We're sorry for the incovenience", fetchReply: true });
        // purgeRet(res);
    }

    static async categoryEveryonePermissionsUpdate({ guild, client }, id, bool) {
        const cmd = client.application.commands.cache.get(id);
        let newPerms;
        const bypasses = guild.commandPermissions[id];
        let toPerms = [...bypasses];
        const removeIndex = toPerms.findIndex(r => r.id === guild.id);
        if (removeIndex >= 0) toPerms.splice(removeIndex, 1);
        if (cmd.defaultPermission === bool) {
            newPerms = toPerms;
        } else newPerms = [...toPerms, {
            id: guild.id,
            type: "ROLE",
            permission: bool
        }];
        const res = await client.application.commands.permissions.set({
            guild: guild.id,
            command: id,
            permissions: newPerms
        });
        this.updateGuildCommandPermissions(id, guild, res);
        return true;
    }

    /**
     * 
     * @param {ButtonInteraction} inter 
     * @param {*} args 
     */
    static async set(inter, args) {
        // const cmd = args[1] ? inter.client.application.commands.cache.get(args[1]) : null;
        if (args[0] === "bypassRoles") {
            return this.setBypasses(inter, args[1], "ROLE");
        } else if (args[0] === "bypassUsers") {
            return this.setBypasses(inter, args[1], "USER");
        } else {
            const res = await inter.reply({ content: "This feature is still in development and isn't ready yet. We're sorry for the incovenience", fetchReply: true });
            purgeRet(res);
        }
    }

    static async setBypasses(inter, id, type) {
        let rType;
        let sName;
        if (type === "ROLE") {
            sName = "roles";
            rType = "USER";
        } else if (type === "USER") {
            sName = "users";
            rType = "ROLE";
        }
        const prompt = await inter.reply({ content: `Provide ${sName.slice(-1)}'s names, mentions or Ids to bypass separated with \` \` (space):`, fetchReply: true });
        const collect = await prompt.channel.awaitMessages({ max: 1, filter: (m) => m.author.id === inter.user.id && m.content?.length });
        const got = collect.first();
        const parsed = await ArgsParser[sName](inter.guild, got.content);
        let timeout = 0;
        if (parsed.unknown.length) {
            const cont = inter.client.finalizeStr(`Unknown ${sName}: ` + parsed.unknown.join(", "), true);
            prompt.edit({ content: cont, allowedMentions: { parse: [] } });
            timeout = 5000;
        }
        if (parsed[sName].length) {
            const hasEveryone = parsed[sName].some(u => u.id === inter.guild.id);
            const ignorePerms = inter.guild.commandPermissions[id].filter(
                r => r.type === rType || (!hasEveryone && r.id === inter.guild.id)
            );
            if ((parsed[sName].length + ignorePerms.length) > 10)
                throw new RangeError("Permissions override can't be more than 10");
            const permissions = [];
            for (const R of parsed[sName]) {
                permissions.push({
                    id: R.id,
                    type: type,
                    permission: true
                });
            }
            const toUpdate = [...permissions, ...ignorePerms];
            const res = await inter.client.application.commands.permissions.set({
                command: id, // cmd.id,
                guild: inter.guild.id,
                permissions: toUpdate
            });
            this.updateGuildCommandPermissions(id, inter.guild, res);
        }
        purgeRet(prompt, got, timeout);
        return true;
    }

    static async remove(inter, args) {
        if (args[0] === "bypass") {
            inter.deferUpdate();
            const res = await inter.client.application.commands.permissions.set({
                command: args[1], // cmd.id,
                guild: inter.guild.id,
                permissions: inter.guild.commandPermissions?.[args[1]]?.filter(r => r.permission === false) || []
            });
            this.updateGuildCommandPermissions(args[1], inter.guild, res);
            return true;
        }
    }

    static updateGuildCommandPermissions(id, guild, permissions) {
        logDev("updateGuildCommandPermissions", id, guild.name, guild.id, permissions);
        if (permissions instanceof Collection)
            permissions = permissions.map(r => r);
        if (!guild.commandPermissions)
            guild.commandPermissions = {};
        logDev(guild.commandPermissions[id]);
        guild.commandPermissions[id] = permissions;
    }
}

module.exports = { CommandSettingsHelper }

function purgeRet(clMsg, usMsg, timeout = 5000) {
    setTimeout(
        () => {
            if (usMsg && clMsg.channel.permissionsFor(clMsg.author).has("MANAGE_MESSAGES"))
                return clMsg.channel.bulkDelete([clMsg, usMsg]).catch(logDev);
            else if (!clMsg.deleted) return clMsg.delete();
        }, timeout
    );
}