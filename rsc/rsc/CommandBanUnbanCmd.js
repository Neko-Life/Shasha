'use strict';

const { Collection, MessageEmbed } = require("discord.js");
const { Command } = require("../classes/Command");
const { logDev } = require("../debug");
const { tickPadEnd, maxStringsLength, getColor } = require("../functions");

module.exports = class CommandBanUnbanCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "commandbanunban",
            ownerOnly: true
        });
    }

    async run(inter, { guild, user, action }) {
        if (!(guild || user)) {
            const getG = await this.client.loadBannedGuilds();
            const getU = await this.client.loadBannedUsers();
            return inter.reply("```js\n"
                + "Guild".padEnd(6, " ")
                + ": " + getG.length + "\n"
                + "User".padEnd(6, " ")
                + ": " + getU.length + "```");
        }
        await inter.deferReply();

        this.embed = new MessageEmbed()
            .setTitle(action)
            .setColor(getColor(
                action === "Ban"
                    ? "red"
                    : "green"));

        this.action = action;
        if (guild) {
            this.guildsToBan = [];
            this.noGuilds = [];
            const arg = guild.value.split(/ +/);
            for (const T of arg) {
                let G;
                if (T.toLowerCase() === "here") G = inter.guild;
                else G = inter.client.findGuilds(T, "i", true);
                if (G instanceof Collection) G = G.first();
                if (!G) {
                    this.noGuilds.push(T);
                    continue;
                }
                this.guildsToBan.push(G);
            }
            if (arg.length) {
                const res = await this[action.toLowerCase() + "Guild"](this.guildsToBan);
                logDev(res);
                this.addFields({ fieldName: "Guild", count: arg.length, res, noKey: "noGuilds" });
            }
        }
        if (user) {
            this.usersToBan = [];
            this.noUsers = [];
            const arg = user.value.split(/ +/);
            for (const T of arg) {
                let U = await this.client.findUsers(T, "i");
                if (U instanceof Collection) U = U.first();
                if (!U) {
                    this.noUsers.push(T);
                    continue;
                }
                this.usersToBan.push(U);
            }
            if (arg.length) {
                const res = await this[action.toLowerCase() + "User"](this.usersToBan);
                logDev(res);
                this.addFields({ fieldName: "User", count: arg.length, res, noKey: "noUsers" });
            }
        }
        return inter.editReply({ embeds: [this.embed] });
    }

    addFields({ fieldName, count, res, noKey }) {
        const data = {
            [fieldName + " count"]: count
        }
        if (res.already.length)
            data[(
                this.action === "Ban"
                    ? "Already"
                    : "Not"
            ) + " banned"] = res.already.length;
        if (res[this.action.toLowerCase() + "ned"].length)
            data[(
                this.action === "Ban"
                    ? "B" : "Unb"
            ) + "anned"] = res[this.action.toLowerCase() + "ned"].map(r => r.name || r.tag).join(" ");
        if (this[noKey].length)
            data["Unknown " + fieldName.toLowerCase()] = this[noKey].join(", ");
        if (res.error?.length)
            data["Error"] = "``js\n" + res.error.join("\n") + "``";
        const toMax = Object.keys(data);
        const maxP = maxStringsLength(toMax) + 1;
        let desc = "";
        for (const k in data) desc += tickPadEnd(k, maxP) + ": " + tickPadEnd(data[k]) + "\n";
        this.embed.addField(fieldName, desc);
    }
}