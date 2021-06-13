'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend, ranLog } = require("../../resources/functions");
const { database } = require("../../database/mongo");
const col = database.collection("Guild");

module.exports = class quoteotd extends commando.Command {
    constructor(client) {
        super(client, {
            name: "quoteotd",
            memberName: "quoteotd",
            group: "utility",
            description: "Set Quote of the day channel and settings.",
            details:"```\n--channel\n--text\n--icon```",
            guildOnly: true,
            userPermissions:["ADMINISTRATOR"]
        });
    }
    async run(msg, arg) {
        const args = arg.trim().split(/(\-\-)+/);
        if (args.length < 2) {
            return trySend(this.client, msg, `Provide argument: \`--channel [mention, ID], --text [footer text], --icon [url footer icon]\``);
        }
        let result = '';
        for(const arr of args) {
            const startW = arr.toLowerCase();
            let data;
            if (startW.startsWith('channel')) {
                data = arr.slice('channel'.length).trim();
                if (data.startsWith('<')) {
                    data = data.slice(2,-1);
                }
                if (!this.client.channels.cache.get(data)) {
                    return trySend(this.client, msg, 'Invalid/unknown channel provided! Try mentioning a channel or use `ChannelID`');
                } else {
                    col.updateOne({document: msg.guild.id}, {$set: {"settings.quoteOTD.channel": data}, $setOnInsert: { document: msg.guild.id }}, { upsert: true });
                    result = result+`Channel set to \`${this.client.channels.cache.get(data).name}\`\n`;
                }
            }
            if (startW.startsWith('text')) {
                data = arr.slice('text'.length).trim();
                col.updateOne({document: msg.guild.id}, {$set: {"settings.quoteOTD.footerText": data}, $setOnInsert: { document: msg.guild.id }}, { upsert: true });
                result = result+`Footer text set to \`${data}\`\n`;
            }
            if (startW.startsWith('icon')) {
                data = arr.slice('icon'.length).trim();
                if (!/^http/.test(data)) {
                    return trySend(this.client, msg, 'Invalid icon url provided!');
                } else {
                    col.updateOne({document: msg.guild.id}, {$set: {"settings.quoteOTD.footerIcon": data}, $setOnInsert: { document: msg.guild.id }}, { upsert: true });
                    result = result+`Footer icon set!\n`;
                }
            }
        }
        if (result.length > 0) {
            ranLog(msg, result);
            return trySend(this.client, msg, result);
        } else {
            return trySend(this.client, msg, `Provide argument: \`--channel [mention, ID], --text [footer text], --icon [url footer icon]\``);
        }
    }
};