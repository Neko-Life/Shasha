"use strict";

const { CommandInteraction, MessageOptions, GuildChannel } = require("discord.js");
const { Command } = require("../classes/Command");
const { addUserExp, loadDb } = require("../database");
const { logDev } = require("../debug");

const ENUM_CHECK_COMMAND_NO_REPLY_OPTIONS = {
    "USER_BANNED": 1,
    "OWNER_ONLY": 2,
    "GUILD_BANNED": 3,
    "GUILD_ONLY": 4,
    "COMMAND_DISABLED": 5,
    "NSFW_ONLY": 6,
    "NO_PERMISSIONS": 7,
    "NO_USER_PERMISSIONS": 8,
    "NO_CLIENT_PERMISSIONS": 9,
}

module.exports = class CommandHandler {
    /**
     * @param {import("../typins").ShaCommandInteraction} interaction 
     */
    static async handle(interaction) {
        // try {
        const cmd = await this.checkCmd(interaction, this.getInteractionCmd(interaction));
        // } catch {
        //     delete cmd.constant;
        //     const randCmd = [];
        //     for (const T in cmd) {
        //         randCmd.push(cmd[T]);
        //     }
        //     cmd = new randCmd[Math.floor(Math.random() * randCmd.length)];
        // }
        if (!(cmd instanceof Command))
            if (interaction.replied) return;
            else return CommandHandler.replyDel(interaction, "Command `/"
                + interaction.commandPath.join(" ")
                + "` not found, maybe got hacked or somethin");

        let result, dST, dSE;
        try {
            dST = new Date();
            result = await cmd.run(interaction, interaction.args);
            dSE = new Date();
        } catch (e) {
            const mes = interaction.client.finalizeStr(
                e.message
            );
            /**
             * @type {MessageOptions}
             */
            const send = { content: mes };
            if (interaction.guild)
                send.allowedMentions = { parse: [] };
            if (interaction.deferred || interaction.replied)
                result = interaction.editReply(send);
            else result = interaction.reply(send);
            e.interaction = interaction;
            e.command = cmd;
            process.emit("error", e);
        }
        interaction.commandResults = [];
        if (!Array.isArray(result))
            result = [result];

        for (let res of result) {
            if (res) {
                if (res instanceof Promise)
                    res = await res;
                if (res)
                    res.invoker = interaction.user;
            }
            interaction.commandResults.push(res);
        }
        await addUserExp(interaction.user, { maxRandom: 100, round: "floor", divide: 1000 });
        interaction.client.handledCommands.set(
            interaction.id,
            { interaction: interaction, command: cmd }
        );
        if (interaction.user.lastAutocomplete?.commandPath === interaction.commandPath.join("/")) {
            const lac = interaction.user.lastAutocomplete;
            logDev(lac);
            logDev(interaction.user.autocomplete);
            const db = lac.db || {};
            const commands = lac.autocomplete.commands;
            const iterator = {};
            for (const k in commands)
                iterator[k] = Object.entries(commands[k]);
            logDev(iterator);
            for (const k in interaction.args) {
                if (interaction.args[k].value?.length > 100) continue;
                /**
                 * @type {[string, any][]}
                 */
                const iterate = iterator[k];
                const found = iterate?.find(v => (v[1].value || v[1]) === interaction.args[k].value);
                if (!db[k]) db[k] = [];
                const foundSaved = db[k].findIndex(r => r?.value === interaction.args[k].value);
                if (foundSaved === -1) {
                    const add = {
                        name: "Recent | " + (found
                            ? (found[1]?.name || found[1])
                            : interaction.args[k].value),
                        value: interaction.args[k].value
                    };
                    db[k].splice(0, 0, add);
                } else {
                    db[k].splice(0, 0, ...db[k].splice(foundSaved, 1));
                }
                const limit = (
                    lac.autocomplete.preview && iterate
                        ? (
                            iterate.length >= 20
                                ? 5
                                : 25 - iterate.length
                        ) : 25
                );
                if (db[k].length > limit) db[k] = db[k].slice(0, limit);
            }
            if (!interaction.user.autocomplete[lac.commandPath])
                interaction.user.autocomplete[lac.commandPath] = {};
            interaction.user.autocomplete[lac.commandPath] = db;
            logDev(interaction.user.autocomplete);
            const udb = loadDb(interaction.user, "user/" + interaction.user.id);
            udb.db.set("recentAutocomplete", lac.commandPath, { value: db });
        }
        logDev("Interaction",
            interaction.commandName,
            interaction.id, "run by",
            interaction.user.tag, "in",
            interaction.channel.name,
            interaction.guild?.name,
            "\nin",
            dSE && dST
                ? (dSE.valueOf() - dST.valueOf()).toString() + " ms"
                : "Error");
    }

    /**
     * 
     * @param {CommandInteraction} interaction 
     * @returns {Command}
     */
    static getInteractionCmd(interaction) {
        const category = interaction.client.commands[interaction.commandName];
        if (!category)
            return CommandHandler.replyDel(interaction,
                `Category/command \`${interaction.commandName}\` not found. Maybe removed/hacked or somethin`
            );
        interaction.commandPath = [];
        interaction.commandPath.push(interaction.commandName);
        let subCategory, toArgs;
        if (interaction.options._group) {
            subCategory = category[interaction.options._group];
            if (!subCategory)
                return CommandHandler.replyDel(interaction,
                    `Sub-category \`${interaction.options._group}\` got sucked into a blackhole and gone forever`
                );
            interaction.commandPath.push(interaction.options._group);
        }
        /**
         * @type {Command}
         */
        let cmd;
        if (interaction.options._subcommand || subCategory) {
            if (subCategory) {
                cmd = subCategory[interaction.options._subcommand];
                toArgs = interaction.options.data[0].options[0].options;
            } else {
                cmd = category[interaction.options._subcommand];
                toArgs = interaction.options.data[0].options;
            }
            if (!cmd)
                return CommandHandler.replyDel(interaction,
                    `Command \`${interaction.options._subcommand}\` was eaten by _me_. I'm not sorry cuz i'm hungry`
                );
            interaction.commandPath.push(interaction.options._subcommand);
        } else {
            cmd = category;
            toArgs = interaction.options.data;
        }
        interaction.args = {};
        if (toArgs?.length)
            for (const D of toArgs) {
                if (typeof D.value === "string")
                    D.value = D.value.trim();
                const Dsplit = D.name.split(/-/);
                if (Dsplit.length)
                    for (let i = 0; i < Dsplit.length; i++) {
                        if (!i) continue;
                        else Dsplit[i] = Dsplit[i][0].toUpperCase() + Dsplit[i].slice(1);
                    };
                interaction.args[Dsplit.join("")] = D;
            };
        if (cmd.prototype instanceof Command)
            return new cmd(interaction);
    }

    /**
     * @typedef {keyof ENUM_CHECK_COMMAND_NO_REPLY_OPTIONS} CheckCmdNoReplyOpt
     * 
     * @typedef {object} CheckCmdOpts
     * @property {CheckCmdNoReplyOpt[]} noReply
     * @property {GuildChannel} overrideClientPermissionsToChannel
     * @property {GuildChannel} overrideUserPermissionsToChannel
     * @property {GuildChannel} overridePermissionsToChannel
     * 
     * @param {CommandInteraction} interaction 
     * @param {Command} cmd 
     * @param {CheckCmdOpts} param2
     * @returns {Promise<Command>}
     */
    static async checkCmd(interaction, cmd, { noReply = [], overridePermissionsToChannel, overrideClientPermissionsToChannel, overrideUserPermissionsToChannel } = {}) {
        if (!(cmd instanceof Command)) return;
        if (await cmd.userBanned()) {
            if (noReply.includes("USER_BANNED")) return false;
            return CommandHandler.replyDel(interaction, "You can't command me anymore! Go away!");
        }

        if (cmd.ownerOnly) {
            if (!interaction.client.isOwner(interaction.user)) {
                if (noReply.includes("OWNER_ONLY")) return false;
                return CommandHandler.replyDel(interaction, "Excuse me? I'm sorry who're you again?");
            }
        }

        if (cmd.guildOnly)
            if (!interaction.guild) {
                if (noReply.includes("GUILD_ONLY")) return false;
                return CommandHandler.replyDel(interaction, "This command can only be run in servers");
            }

        if (interaction.guild) {
            if (await cmd.guildBanned()) {
                if (noReply.includes("GUILD_BANNED")) return false;
                return CommandHandler.replyDel(interaction, "Something's wrong, please contact the support server by running `/info support`");
            }
            if (await cmd.disabled()) {
                if (noReply.includes("COMMAND_DISABLED")) return false;
                return CommandHandler.replyDel(interaction, "You can't command me here...");
            }
            if (cmd.nsfwOnly)
                if (!interaction.channel.nsfw) {
                    if (noReply.includes("NSFW_ONLY")) return false;
                    return CommandHandler.replyDel(interaction, "This is not a NSFW channel baka!");
                }

            const lackUser = [];
            const lackClient = [];
            if (!interaction.client.isOwner(interaction.user) &&
                !cmd.bypass && cmd.userPermissions.length) {
                const seri = (overrideUserPermissionsToChannel || overridePermissionsToChannel || interaction.channel).permissionsFor(interaction.user).serialize();
                const perms = [];
                if (seri.ADMINISTRATOR) perms.push("ADMINISTRATOR");
                else for (const D in seri) {
                    if (!seri[D]) continue;
                    perms.push(D);
                }
                if (!perms.includes("ADMINISTRATOR"))
                    for (const A of cmd.userPermissions) {
                        if (perms.includes(A)) continue;
                        lackUser.push(A);
                    }
                if (lackUser.length)
                    if (noReply.includes("NO_USER_PERMISSIONS")) return false;
            }
            if (cmd.clientPermissions.length) {
                const seri = (overrideClientPermissionsToChannel || overridePermissionsToChannel || interaction.channel).permissionsFor(interaction.client.user).serialize();
                const perms = [];
                if (seri.ADMINISTRATOR) perms.push("ADMINISTRATOR");
                else for (const D in seri) {
                    if (!seri[D]) continue;
                    perms.push(D);
                }
                if (!perms.includes("ADMINISTRATOR"))
                    for (const A of cmd.clientPermissions) {
                        if (perms.includes(A)) continue;
                        lackClient.push(A);
                    }
                if (lackClient.length)
                    if (noReply.includes("NO_CLIENT_PERMISSIONS")) return false;
            }
            if (lackUser.length || lackClient.length) {
                let lackPermMsg = "";
                if (lackClient.length) lackPermMsg += (
                    `Gib me these permissions <:nekoknifeLife:851287828453261322>`
                    + "```js\n" + lackClient.join(", ") + "```"
                );
                if (lackUser.length) lackPermMsg += (
                    (lackClient.length ? "you also need" : "Get") + ` these permissions`
                    + "```js\n" + lackUser.join(", ") + "```"
                );
                if (lackPermMsg.length) {
                    if (noReply.includes("NO_PERMISSIONS")) return false;
                    return CommandHandler.replyDel(interaction, lackPermMsg + "then we talk <:dunnoLife:853087375440871456>");
                }
            }
        }
        return cmd;
    }

    static async replyDel(interaction, message, timeout = 15000) {
        const mes = await interaction.reply({ content: message, fetchReply: true });
        setTimeout(() => mes.deleted ? null : mes.delete(), timeout);
        return;
    }
}
