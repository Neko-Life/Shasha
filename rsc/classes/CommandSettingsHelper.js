'use strict';

const { ButtonInteraction, Collection } = require("discord.js");
const ArgsParser = require("./ArgsParser");
const { logDev } = require("../debug");

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
        const prompt = await inter.reply({ content: `Provide ${sName} \`<Id>\`, \`<name>\` or \`<mention>\` to bypass separated with \` \` (space):`, fetchReply: true });
        const collect = await prompt.channel.awaitMessages({ max: 1, filter: (m) => m.author.id === inter.user.id });
        const got = collect.first();
        const roles = await ArgsParser.roles(inter.guild, got.content);
        let timeout;
        if (roles.unknown.length) {
            const cont = inter.client.finalizeStr(`Unknown ${sName}: ` + roles.unknown.join(", "), true);
            prompt.edit({ content: cont, allowedMentions: { parse: [] } });
            timeout = 10000;
        } else timeout = 0;
        if (roles.roles.length) {
            const ignorePerms = inter.guild.commandPermissions[id].filter(r => r.type === rType);
            if ((roles.roles.length + ignorePerms.length) > 10)
                throw new RangeError("Permissions override can't be more than 10");
            const permissions = [];
            for (const R of roles.roles) {
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
                permissions: []
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
                return clMsg.channel.bulkDelete([clMsg, usMsg]);
            else if (!clMsg.deleted) return clMsg.delete();
        }, timeout
    );
}