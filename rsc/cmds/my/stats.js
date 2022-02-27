"use strict";

const { MessageEmbed } = require("discord.js");
const OS = require("os");
const { Command } = require("../../classes/Command");

module.exports = class BotStatsCmd extends Command {
    constructor(interacrion) {
        super(interacrion, {
            name: "stats"
        });
    }

    async run(inter) {
        const data = {};
        for (const I in OS) {
            const fn = OS[I];
            if (typeof fn === "function" && fn.length === 0) {
                data[I] = fn();
            } else data[I] = fn;
        }
        const emb = new MessageEmbed();
        for (const A in data) {
            if (!data[A] || data[A] === '\n') continue;
            if (typeof data[A] === "string") emb.addField(A, data[A]);
        }
        return inter.reply({ embeds: [emb] });
    }
}
