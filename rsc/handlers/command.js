'use strict';

const { CommandInteraction, MessageOptions } = require("discord.js");
const { Command } = require("../classes/Command");
const { allowMention, isAdmin } = require("../functions");
const { addUserExp } = require("../database");

module.exports = class CommandHandler {
    /**
     * @param {CommandInteraction} interaction 
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
            else return interaction.reply("Command `/"
                + interaction.commandPath.join(" ")
                + "` not found, maybe got hacked or somethin");

        let result;
        try {
            result = await cmd.run(interaction, interaction.args);
        } catch (e) {
            const mes = interaction.client.finalizeStr(
                e.message,
                isAdmin(interaction.member || interaction.user)
            );
            /**
             * @type {MessageOptions}
             */
            const send = { content: mes };
            if (interaction.guild)
                send.allowedMentions = allowMention(
                    { member: interaction.member, content: mes }
                );
            if (interaction.deferred || interaction.replied)
                result = interaction.editReply(send);
            else result = interaction.reply(send);
            process.emit("error", e);
        }
        interaction.commandResults = [];
        if (Array.isArray(result)) for (const res of result) {
            if (res) {
                if (res instanceof Promise) await res;
                res.invoker = interaction.user;
            }
            interaction.commandResults.push(res);
        } else {
            if (result) {
                if (result instanceof Promise) await result;
                result.invoker = interaction.user;
            }
            interaction.commandResults.push(result);
        }
        await addUserExp(interaction.user, { maxRandom: 100, round: "floor", divide: 1000 });
        interaction.client.handledCommands.set(
            new Date().toUTCString(),
            { interaction: interaction, command: cmd }
        );
        console.log("Interaction",
            interaction.commandName,
            interaction.id, "run by",
            interaction.user.tag, "in",
            interaction.channel.name,
            interaction.guild?.name);
    }

    /**
     * 
     * @param {CommandInteraction} interaction 
     * @returns {Command}
     */
    static getInteractionCmd(interaction) {
        const category = interaction.client.commands[interaction.commandName];
        if (!category)
            return interaction.reply(
                `Category/command \`${interaction.commandName}\` not found. Maybe removed/hacked or somethin`
            );
        interaction.commandPath = [];
        interaction.commandPath.push(interaction.commandName);
        let subCategory, toArgs;
        if (interaction.options._group) {
            subCategory = category[interaction.options._group];
            if (!subCategory)
                return interaction.reply(
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
                return interaction.reply(
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
     * 
     * @param {CommandInteraction} interaction 
     * @param {Command} cmd 
     * @returns {Promise<Command>}
     */
    static async checkCmd(interaction, cmd) {
        if (!(cmd instanceof Command)) return;
        if (await cmd.userBanned()) return interaction.reply("You can't command me anymore! Go away!");

        if (cmd.ownerOnly) {
            if (!interaction.client.isOwner(interaction.user))
                return interaction.reply("Excuse me? I'm sorry who're you again?");
        }

        if (interaction.guild) {
            if (await cmd.guildBanned()) return interaction.reply("Something's wrong, please contact the support server by running `/info support`");
            if (await cmd.disabled()) return interaction.reply("You can't command me here...");
            if (cmd.nsfwOnly)
                if (!interaction.channel.nsfw)
                    return interaction.reply("This is not an NSFW channel baka!");

            const lackUser = [];
            const lackClient = [];
            if (!interaction.client.isOwner(interaction.user) &&
                !cmd.bypass && cmd.userPermissions.length) {
                const seri = interaction.channel.permissionsFor(interaction.user).serialize();
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
            }
            if (cmd.clientPermissions.length) {
                const seri = interaction.channel.permissionsFor(interaction.client.user).serialize();
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
                    return interaction.reply(lackPermMsg + "then we talk <:dunnoLife:853087375440871456>");
                }
            }
        }
        return cmd;
    }
}