"use strict";

const { MessageEmbed } = require("discord.js");
const { Command } = require("../../classes/Command");
const { loadDb } = require("../../database");
const { getColor } = require("../../functions");

module.exports = class ListLockedCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "list-locked",
            description: "List all locked channel in the server",
            guildOnly: true,
        })
    }

    async run(inter) {
        await inter.deferReply();
        const locked = [];
        for (const [k, v] of this.guild.channels.cache.filter(r => r.isText?.() && !r.isThread?.())) {
            const gC = loadDb(v, `channel/${v.id}`);
            const get = await gC.db.getOne("lockdown", "Object[]");
            if (!get) continue;
            locked.push(v);
        }
        const desc = locked.length
            ? "> <#" + locked.map(r => r.id).join(">\n> <#") + ">"
            : "No locked channel in this server. Yayyy!";
        const emb = new MessageEmbed()
            .setColor(getColor(this.user.accentColor, true, this.member.displayColor))
            .setTitle("Locked Channels")
            .setDescription(desc.slice(0, 4000));
        return inter.editReply({ embeds: [emb] });
    }
}