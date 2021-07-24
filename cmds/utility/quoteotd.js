'use strict';

const commando = require("@iceprod/discord.js-commando"),
    { trySend, ranLog, parseDoubleDash, getChannel, reValidURL } = require("../../resources/functions"),
    ARGS_TEXT = `Provide argument: \`--c channel_[mention|ID], --t text_[footer_text], --i [footer_icon_URL]\``;

module.exports = class quoteotd extends commando.Command {
    constructor(client) {
        super(client, {
            name: "quoteotd",
            memberName: "quoteotd",
            group: "utility",
            description: "Set Quote of the day channel and settings.",
            details: "```\n--channel\n--text\n--icon```",
            guildOnly: true,
            userPermissions: ["ADMINISTRATOR"]
        });
    }
    async run(msg, arg) {
        if (!msg.guild.DB) await msg.guild.DB.dbLoad();
        const args = parseDoubleDash(arg);
        if (!args || args.length < 2) {
            return trySend(this.client, msg, ARGS_TEXT);
        }
        let result = '';
        for (const arr of args) {
            const startW = arr.toLowerCase();
            let data;
            if (startW.startsWith('c ')) {
                data = arr.slice('c '.length).trim();
                const CHAN = getChannel(msg, data, ["category", "voice"]);
                msg.guild.DB.quoteOTD.channel = CHAN.id;
                result += `Channel set: **${CHAN.name}**\n`;
                continue;
            }
            if (startW.startsWith('t ')) {
                data = arr.slice('t '.length).trim();
                msg.guild.DB.quoteOTD.footerText = data;
                result += `Footer text set: \`${data}\`\n`;
                continue;
            }
            if (startW.startsWith('icon')) {
                data = arr.slice('icon'.length).trim();
                if (!reValidURL.test(data)) {
                    result += 'Invalid icon URL provided!\n';
                    continue;
                } else {
                    msg.guild.DB.quoteOTD.footerIcon = data;
                    result += `Footer icon set!\n`;
                    continue;
                }
            }
        }
        if (result.length > 0) {
            if (result !== 'Invalid icon URL provided!\n') msg.guild.DB.setDb("quoteOTD", msg.guild.DB.quoteOTD);
            ranLog(msg, result);
            return trySend(this.client, msg, result);
        } else {
            return trySend(this.client, msg, ARGS_TEXT);
        }
    }
};