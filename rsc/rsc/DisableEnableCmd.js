'use strict';

const { MessageEmbed, Guild } = require("discord.js");
const { Command } = require("../classes/Command");
const { emphasizePerms, getColor } = require("../functions");
const { loadDb } = require("../database");
const ArgsParser = require("../classes/ArgsParser");

module.exports = class DisableEnableCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "disableenable",
            guildOnly: true,
            userPermissions: ["ADMINISTRATOR"],
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
            return this.showDisabled();
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
            const parsed = ArgsParser.channels(this.guild, channels.value);
            this.disableOpt.channels = parsed.channels.map(r => r.id);
            if (this.disableOpt.channels?.length)
                this.resultMes += "**Setting up for channels**:\n<#" + this.disableOpt.channels.join(">, <#") + ">\n";
            if (parsed.unknown.length)
                this.resultMes += `Unknown channels:\n\`${parsed.unknown.join("`, `")}\`\n`;
        }

        if (!this.disableOpt.channels?.length)
            this.resultMes += "**Setting up for whole server**\n";

        if (bypassRoles) {
            const parsed = ArgsParser.roles(this.guild, bypassRoles.value);
            this.disableOpt.bypass.roles = parsed.roles.map(r => r.id);
            if (this.disableOpt.bypass.roles.length)
                this.resultMes += "**Bypass roles**:\n<@&" + this.disableOpt.bypass.roles.join(">, <@&") + ">\n";
            if (parsed.unknown.length)
                this.resultMes += `Unknown roles:\n\`${parsed.unknown.join("`, `")}\`\n`;
        }

        if (bypassUsers) {
            const parsed = await ArgsParser.users(this.guild, bypassUsers.value);
            this.disableOpt.bypass.users = parsed.users.map(r => r.id);
            if (this.disableOpt.bypass.users)
                this.resultMes += "**Bypass users**:\n<@" + this.disableOpt.bypass.users.join(">, <@") + ">\n";
            if (parsed.unknown.length)
                this.resultMes += `Unknown users:\n\`${parsed.unknown.join("`, `")}\`\n`;
        }

        if (bypassPermissions) {
            const parsed = ArgsParser.permissions(bypassPermissions.value);
            this.disableOpt.bypass.permissions = parsed.perms;
            if (this.disableOpt.bypass.permissions.length) {
                const emph = [];
                for (const K of this.disableOpt.bypass.permissions)
                    emph.push(emphasizePerms(K));
                this.resultMes += "**Bypass permissions**:```js\n" + emph.join(", ") + "```";
            }
            if (parsed.noMatch.length)
                this.resultMes += "No permissions matched:\n`" + parsed.noMatch.join("`, `") + "`\n";
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

    async showDisabled() {
        const gd = loadDb(this.guild, "guild/" + this.guild.id);
        const data = await gd.db.get("commandDisabled", String);
        const emb = new MessageEmbed()
            .setTitle("Disabled Commands")
            .setColor(getColor(this.user.accentColor, true) || getColor(this.member.displayColor, true));
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
                    + v.bypass.users.join(">, <@") + ">";
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
        return this.interaction.editReply({ embeds: [emb] });
    }
}