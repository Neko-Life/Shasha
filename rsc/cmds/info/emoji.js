'use strict';

const { Command } = require("../../classes/Command");

module.exports = class InfoEmojiCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "infoemoji",
            description: "Show emoji info"
        });
    }

    async run(inter, { emoji }) {
        let find = this.client.emojis.resolve(emoji.value.match(/\d{18,20}/)?.[0] || emoji.value);
        if (!find) {
            const reF = emoji.value.match(/[a-z0-9-_]{1,32}/i)?.[0];
            if (!reF) return inter.reply("Invalid input. Provide emoji name, Id, or the emoji itself");
            find = this.client.emojis.cache.filter(r => r.name.toLowerCase() === reF.toLowerCase())?.first();
            if (!find) return inter.reply("Can't find that emoji :c");
        }
        return inter.reply(`<${find.animated ? "a" : ""}:${find.name}:${find.id}>`);
    }
}