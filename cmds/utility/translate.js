'use strict';

const commando = require("@iceprod/discord.js-commando");
const { default: axios } = require("axios");
const { Message } = require("discord.js");
const { trySend, getChannelMessage, defaultImageEmbed } = require("../../resources/functions");
const SPLG = [
    "en",
    "ar",
    "zh",
    "fr",
    "de",
    "hi",
    "id",
    "ga",
    "it",
    "ja",
    "ko",
    "pl",
    "pt",
    "ru",
    "es",
    "tr",
    "vi"
],
    REG = /(?<!\\)--m +[^\s\n]+( +\d{17,19})?/;

module.exports = class translate extends commando.Command {
    constructor(client) {
        super(client, {
            name: "translate",
            aliases: ["t", "trans"],
            memberName: "translate",
            group: "utility",
            description: "Translate some alien languages.",
            details: "**Supported languages:**\n" +
                `\`en\` English\n` +
                `\`ar\` Arabic\n` +
                `\`zh\` Chinese\n` +
                `\`fr\` French\n` +
                `\`de\` German\n` +
                `\`hi\` Hindi\n` +
                `\`id\` Indonesian\n` +
                `\`ga\` Irish\n` +
                `\`it\` Italian\n` +
                `\`ja\` Japanese\n` +
                `\`ko\` Korean\n` +
                `\`pl\` Polish\n` +
                `\`pt\` Portuguese\n` +
                `\`ru\` Russian\n` +
                `\`es\` Spanish\n` +
                `\`tr\` Turkish\n` +
                `\`vi\` Vietnamese\n\n` +
                `\`--h\` for help`
        });
    }
    /**
     * 
     * @param {Message} msg
     * @param {*} arg
     */
    async run(msg, arg) {
        if (/(?<!\\)--h/.test(arg)) {
            const emb = defaultImageEmbed(msg, null, "Usage");
            emb.setDescription(`\`${(msg.guild?.commandPrefix || msg.client.commandPrefix) + this.name}\` --\`[h|s|m]\`: [Show help | Supported languages | Message to translate \`[ID|link]\`] \`[Target language]\` \`[Text to translate]\`\n\n` +
                `Example:\n\`${(msg.guild?.commandPrefix || msg.client.commandPrefix) + this.name} ru cyka blyat!!\`\n\`${(msg.guild?.commandPrefix || msg.client.commandPrefix) + this.name} ` +
                `ja catgirl\`\n\`${(msg.guild?.commandPrefix || msg.client.commandPrefix) + this.name} --m https://discord.com/channels/772073587792281600/822274053925503046/859490929475846144 en\``);
            return trySend(msg.client, msg, emb);
        };
        if (/(?<!\\)--s/.test(arg)) {
            const emb = defaultImageEmbed(msg, null, "Help");
            emb.setDescription(this.description + "\n\n" + this.details);
            return trySend(msg.client, msg, emb);
        };
        msg.channel.startTyping();
        const MA = arg.match(REG);
        let tmes;
        if (MA) {
            const A = MA[0].slice(4).trim().split(/ +/);
            console.log(A);
            const C = await getChannelMessage(msg, A[0], A[1]);
            console.log(C);
            if (C) tmes = C;
        };
        arg = arg.replace(REG, "").trim();
        const TP = arg.split(/ +/, 1)?.[0].trim();
        let trans, tar, ic = SPLG.includes(TP);
        if (tmes) trans = tmes.cleanContent || tmes.content;
        if (ic) tar = TP; else tar = "en";
        if (ic) {
            if (!tmes) trans = msg.cleanContent.slice((msg.guild.commandPrefix + msg.alias + TP).length + 2).trim() || msg.channel.messages.cache.get(msg.previousMessageID)?.cleanContent;
        } else {
            if (!tmes) trans = msg.cleanContent.slice((msg.guild.commandPrefix + msg.alias).length + 1).trim() || msg.channel.messages.cache.get(msg.previousMessageID)?.cleanContent;
        };
        if (!trans || trans.length === 0) {
            return trySend(msg.client, msg, "Nothing to translate. `--h` for help <:nekohmLife:846371737644957786>");
        }
        const res = await axios.post("https://translate.mentality.rip/translate", {
            q: trans.replace(/\./g, ","),
            source: "auto",
            target: tar
        }).then(r => {
            console.log(r.data);
            return r.data.translatedText;
        }).catch(console.error);
        return trySend(msg.client, msg, res);
    }
};