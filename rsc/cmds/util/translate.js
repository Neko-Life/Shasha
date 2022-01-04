'use strict';

const { Command } = require("../../classes/Command");
const { getChannelMessage, allowMention } = require("../../functions");
const translate = require('translate-google');
const { Util } = require("discord.js");

module.exports = class TranslateCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "translate",
            autocomplete: {
                matchKey: true,
                commands: {
                    langTo: translate.languages,
                    langFrom: translate.languages
                }
            }
        });
    }

    async run(inter, { text, langTo, langFrom, message }) {
        const LM = inter.channel.lastMessage;
        await inter.deferReply();
        let toTranslate = text?.value || (!message ? LM?.cleanContent : null);
        if (!toTranslate) {
            let mes;
            const LOW = message.value.toLowerCase();
            if (LOW === "l" || LOW === "last")
                mes = LM;
            else {
                const mesF = message.value.split(/ +/);
                mes = await getChannelMessage(inter, ...mesF);
            }
            if (!mes) return inter.editReply("Unknown message");
            toTranslate = mes.cleanContent;
        }
        if (!toTranslate) return inter.editReply("Nothing to translate");
        let toLang, fromLang;
        if (langTo) {
            toLang = this.getLang(langTo.value);
            if (!toLang) return this.noLang(langTo.value);
        }
        if (langFrom) {
            fromLang = this.getLang(langFrom.value);
            if (!fromLang) return this.noLang(langFrom.value);
        }
        if (!fromLang) fromLang = "auto";
        const translated = await translate(toTranslate, { from: fromLang, to: toLang });
        return inter.editReply(translated);
    }

    #fn = ["isSupported", "getCode"];

    async noLang(lang) {
        let erMe = (lang ? "Unsupported language: **" + lang + "**" : "") + "\nSupported languages:```js\n";
        for (const k in translate.languages) {
            if (this.#fn.includes(k)) continue;
            erMe += k + ": " + translate.languages[k] + "\n";
        }
        erMe += "```";
        erMe = this.client.finalizeStr(erMe, this.isAdmin(true));
        const contents = Util.splitMessage(erMe, {
            append: "```",
            char: "\n",
            maxLength: 2000,
            prepend: "```js\n"
        });
        const ret = [];
        ret[0] = await this.interaction.editReply({
            content: contents[0], allowedMentions: allowMention({
                member: this.interaction.member || this.interaction.user,
                content: contents[0]
            })
        });
        if (contents.length > 1) {
            for (const s of contents.slice(1)) ret.push(await this.interaction.channel.send({
                content: s, allowedMentions: allowMention({
                    member: this.interaction.member || this.interaction.user,
                    content: s
                })
            }));
        }
        return ret;
    }

    getLang(val) {
        let L;
        const t = val.toLowerCase();
        for (const k in translate.languages) {
            if (this.#fn.includes(k)) continue;
            if (t === k || t === translate.languages[k]?.toLowerCase()) {
                L = k;
                break;
            }
        }
        return L;
    }
}