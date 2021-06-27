'use strict';

const commando = require("@iceprod/discord.js-commando");
const { MessageEmbed } = require("discord.js");
const { database } = require("../../database/mongo");
const { errLog, trySend, ranLog } = require("../../resources/functions");
const getColor = require("../../resources/getColor");

module.exports = class servav extends commando.Command {
    constructor(client) {
        super(client, {
            name: "serv-av",
            memberName: "serv-av",
            aliases: ["server-avatar", "serv-avatar", "server-av"],
            group: "profile",
            description: "Show server avatar."
        });
    }
    run(msg, arg) {
        const server_ID = arg.split(/ +/)[0];
        const doc = msg.guild?.id ?? msg.author.id;
        const col = database.collection(msg.guild ? "Guild" : "User");
        col.findOne({document: doc}, (err, res) => {
            if (err) {
                errLog(err, msg, this.client);
            }
            const footerQuote = res?.["settings"]?.defaultEmbed?.footerQuote;
            let icon, target;
            if (server_ID && this.client.owners.includes(msg.author)) {
                if (!/\D/.test(server_ID)) {
                    target = this.client.guilds.cache.get(server_ID);
                } else {
                    return trySend(this.client, msg, "Invalid `server_ID` provided!");
                }
            } else {
                target = msg.guild;
            }
            if (target) {
                icon = target.iconURL({size:4096, dynamic:true});
            } else {
                return trySend(this.client, msg, "I'm not in that server...");
            }
            if (icon) {
                let embed = new MessageEmbed()
                .setImage(icon)
                .setTitle(target.name)
                .setFooter(footerQuote ?? "");
                if (target.owner.displayColor) {
                    const color = getColor(target.owner.displayColor)
                    embed.setColor(color);
                }
                return trySend(this.client, msg, embed);
            }
        });
    }
};