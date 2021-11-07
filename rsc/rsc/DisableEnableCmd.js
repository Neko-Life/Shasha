'use strict';

const { Collection, Permissions, MessageEmbed, Guild } = require("discord.js");
const { Command } = require("../classes/Command");
const { findRoles, findMembers, createRegExp, emphasizePerms, findChannels, getColor } = require("../functions");
const { loadDb } = require("../database");
const perms = [];
for (const k in Permissions.FLAGS)
    perms.push(k);

module.exports = class DisableEnableCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "disableenable",
            guildOnly: true,
            userPermissions: ["MANAGE_GUILD"],
            guarded: true
        });
        this.resultMes = "";
        this.disableOpt = {
            bypass: {}
        };
    }

    async run(inter, { command, channels, bypassRoles, bypassPermissions, bypassUsers, enable }) {
        await inter.deferReply();

        if (!command) {
            const gd = loadDb(inter.guild, "guild/" + inter.guild.id);
            const data = await gd.db.get("commandDisabled", String);
            const emb = new MessageEmbed()
                .setTitle("Disabled Commands")
                .setColor(getColor(inter.member.displayColor));
            if (data.size) for (const [k, v] of data) {
                let res = "";
                if (v.channels.length)
                    res += "**For channels**:\n<#"
                        + v.channels.join(">, <#") + ">\n";
                if (v.bypass.roles?.length)
                    res += "**Bypass roles**:\n<@&"
                        + v.bypass.roles.join(">, <@&") + ">\n";
                if (v.bypass.users?.length)
                    res += "**Bypass users**:\n<@"
                        + this.disableOpt.bypass.users.join(">, <@") + ">";
                if (v.bypass.permissions?.length) {
                    const emph = [];
                    for (const K of v.bypass.permissions)
                        emph.push(emphasizePerms(K));
                    res += "**Bypass permissions**:```js\n"
                        + emph.join(", ") + "```";
                }
                emb.addField("`/" + k.replace(/\//g, " ") + "`", res);
            }
            if (!emb.fields.length)
                emb.setDescription("No disabled command for this server");
            return inter.editReply({ embeds: [emb] });
        }

        if (command.value.startsWith("/")) command.value = command.value.slice(1);
        const commandPath = command.value.toLowerCase().split(/ +/);
        /**
         * @type {Command}
         */
        let cmd;
        if (commandPath[0] === "all") {
            cmd = inter.client.commands;
            commandPath.shift();
        }
        else {
            cmd = inter.client.commands[commandPath[0]];
            if (!cmd) throw new Error("No category found: " + commandPath[0]);
            const iterScmd = commandPath.slice(1);
            if (iterScmd.length)
                for (const K of iterScmd) {
                    cmd = cmd[K];
                    if (!cmd) throw new Error("No command " + K + " in category " + commandPath[0]);
                }
        }

        if (channels) {
            this.disableOpt.channels = [];
            const arg = channels.value.split(/ +/);
            for (const str of arg) {
                let chan = findChannels(inter.guild, str, "i");
                if (chan instanceof Collection) chan = chan.first();
                if (!chan) this.resultMes += "Unknown channel: " + str + "\n";
                else this.disableOpt.channels.push(chan.id);
            }
            if (this.disableOpt.channels.length)
                this.resultMes += "**Setting up for channels**:\n<#" + this.disableOpt.channels.join(">, <#") + ">\n";
        }

        if (!this.disableOpt.channels?.length)
            this.resultMes += "**Setting up for whole server**\n";

        if (bypassRoles) {
            this.disableOpt.bypass.roles = [];
            const arg = bypassRoles.value.split(/ +/);
            for (const str of arg) {
                let role = findRoles(inter.guild, str, "i");
                if (role instanceof Collection) role = role.first();
                if (!role) this.resultMes += "Unknown role: " + str + "\n";
                else this.disableOpt.bypass.roles.push(role.id);
            }
            if (this.disableOpt.bypass.roles.length)
                this.resultMes += "**Bypass roles**:\n<@&" + this.disableOpt.bypass.roles.join(">, <@&") + ">\n";
        }

        if (bypassUsers) {
            this.disableOpt.bypass.users = [];
            const arg = bypassUsers.value.split(/ +/);
            for (const str of arg) {
                let user = findMembers(inter.guild, str, "i");
                if (user instanceof Collection) user = user.first();
                if (!user) user = await inter.client.findUsers(str, "i");
                if (user instanceof Collection) user = user.first();
                if (!user) this.resultMes += "Unknown user: " + str + "\n";
                else this.disableOpt.bypass.users.push(user.id);
            }
            if (this.disableOpt.bypass.users)
                this.resultMes += "**Bypass users**:\n<@" + this.disableOpt.bypass.users.join(">, <@") + ">\n";
        }

        if (bypassPermissions) {
            this.disableOpt.bypass.permissions = [];
            const arg = bypassPermissions.value.split(/ +/);
            for (const str of arg) {
                const fil = perms.filter(
                    r => {
                        const re = createRegExp(str, "i")
                        return re.test(r)
                            || re.test(r.replace(/\_/g, ""))
                            || re.test(r.replace(/\_/g, "-"))
                            || re.test(r.replace(/\_/g, " "))
                    }
                );
                if (fil?.length) {
                    for (const K of fil)
                        if (!this.disableOpt.bypass.permissions.includes(K))
                            this.disableOpt.bypass.permissions.push(K);
                } else this.resultMes += "No permissions matched: " + str + "\n";
            }
            if (this.disableOpt.bypass.permissions.length) {
                const emph = [];
                for (const K of this.disableOpt.bypass.permissions)
                    emph.push(emphasizePerms(K));
                this.resultMes += "**Bypass permissions**:```js\n" + emph.join(", ") + "```";
            }
        }

        const newInter = {
            commandPath: commandPath,
            guild: inter.guild
        }
        if (enable) {
            this.enable = true;
            this.disableOpt.remove = true;
        }
        await this.disableCmd(cmd, newInter);
        const emb = new MessageEmbed()
            .setDescription(this.resultMes)
            .setTitle("Disable/Enable Commands")
            .setColor(getColor(inter.member.displayColor));
        return inter.editReply({ embeds: [emb] });
    }

    /**
     * @typedef {object} DisableCmdOpt
     * @property {string[]} commandPath
     * @property {Guild} guild
     * 
     * @param {Command} target 
     * @param {DisableCmdOpt} opt 
     * @returns 
     */
    async disableCmd(target, opt) {
        if (!(target instanceof Command) && typeof target === "object")
            for (const K in target) {
                const obj = target[K];
                const { commandPath, guild } = opt;
                const newPath = {
                    commandPath: new Array(...commandPath, K),
                    guild: guild
                };
                await this.disableCmd(obj, newPath);
            } else {
            if (!(target.prototype instanceof Command))
                return this.resultMes
                    += "`/" + opt.commandPath.join(" ")
                    + "` isn't Command: "
                    + typeof target + "\n";
            /**
             * @type {Command}
             */
            const cmd = new target(opt);
            if (cmd.guarded && !this.enable)
                return this.resultMes += "`/" + opt.commandPath.join(" ") + "` can't be disabled\n";
            else {
                await cmd.setDisabled(this.disableOpt);
                return this.resultMes += "`/" + opt.commandPath.join(" ") + `\` ${this.enable ? "enabled" : "disabled"}\n`;
            }
        }
    }
}