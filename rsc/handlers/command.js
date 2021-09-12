'use strict';

const { CommandInteraction } = require("discord.js");
const { isArray } = require("lodash");

/**
 * @param {CommandInteraction} interaction 
 */
async function handle(interaction) {
    const category = interaction.client.commands[interaction.commandName];
    interaction.args = {};
    if (!category)
        return interaction.reply(
            `Category/command \`${interaction.commandName}\` not found. Maybe removed/hacked or somethin`
        );
    let subCategory, cmd, toArgs;
    if (interaction.options._group) {
        subCategory = category[interaction.options._group];
        if (!subCategory)
            return interaction.reply(
                `Sub-category \`${interaction.options._group}\` got sucked into a blackhole and gone forever`
            );
        toArgs = interaction.options.data[0].options[0].options[0].options;
    }
    if (interaction.options._subcommand) {
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
    } else {
        cmd = category;
        toArgs = interaction.options.data;
    }
    try {
        cmd = new cmd(interaction);
    } catch {
        delete cmd.constant;
        const randCmd = [];
        for (const T in cmd) {
            randCmd.push(cmd[T]);
        }
        cmd = new randCmd[Math.floor(Math.random() * randCmd.length)];
    }

    if (cmd.ownerOnly) {
        if (!interaction.client.owners.includes(interaction.user))
            return interaction.reply("Sorry i don't know you. You can't make me do that...");
    }

    if (interaction.guild) {
        const lackUser = [];
        const lackClient = [];
        if (cmd.userPermissions.length) {
            const seri = interaction.channel.permissionsFor(interaction.user).serialize();
            const perms = [];
            for (const D in seri) {
                if (!seri[D]) continue;
                perms.push(D);
            }
            for (const A of cmd.userPermissions) {
                if (perms.includes(A)) continue;
                lackUser.push(A);
            }
        }
        if (cmd.clientPermissions.length) {
            const seri = interaction.channel.permissionsFor(interaction.client.user).serialize();
            const perms = [];
            for (const D in seri) {
                if (!seri[D]) continue;
                perms.push(D);
            }
            for (const A of ["VIEW_CHANNEL", ...cmd.clientPermissions]) {
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

    if (toArgs?.length)
        for (const D of toArgs) {
            const Dsplit = D.name.split(/-/);
            if (Dsplit.length)
                for (let i = 0; i < Dsplit.length; i++) {
                    if (!i) continue;
                    else Dsplit[i] = Dsplit[i][0].toUpperCase() + Dsplit[i].slice(1);
                };
            interaction.args[Dsplit.join("")] = D;
        };
    interaction.commandResults = [];
    const result = cmd.run(interaction, interaction.args);
    if (isArray(result)) for (const res of result) {
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
    interaction.client.handledCommands.set(interaction.id, interaction);
    console.log("Interaction",
        interaction.commandName,
        interaction.id, "run by",
        interaction.user.tag, "in",
        interaction.channel.name,
        interaction.guild?.name);
}

module.exports = { handle }