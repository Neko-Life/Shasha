'use strict';

const { CommandInteraction } = require("discord.js");

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

    cmd = new cmd(interaction);

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
                `Get these permissions`
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

    return cmd.run(interaction, interaction.args);
}

module.exports = { handle }