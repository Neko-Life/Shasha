"use strict";

const { Command } = require("../../classes/Command");
const { PATTERN_CUSTOM_EMOTE } = require("../../constants");

module.exports = class JumboCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "jumbo",
            description: "Make emoji JUMBO",
            autocomplete: {
                matchName: false,
                commands: {
                    emoji: Command.constructCommandEmoteAutocomplete(interaction)
                },
                preview: false
            }
        });
    }

    run(inter, { emoji }) {
        const emote = emoji.value.match(new RegExp(PATTERN_CUSTOM_EMOTE))?.[0];
        const id = emote?.match(/\d{17,20}/)?.[0];
        let find = this.client.emojis.resolve(id || emoji.value);
        if (!find) {
            if (id) {
                find = { url: `https://cdn.discordapp.com/emojis/${id}.${emote.startsWith("<a") ? "gif" : "webp"}` };
            } else {
                const match = emoji.value.match(/[a-zA-Z0-9-_]{2,32}/g);
                const reF = match?.[match.length - 1];
                if (!reF) return inter.reply("Invalid input. Provide emoji name, Id, or the emoji itself");
                const lowReF = reF.toLowerCase().replace(/^.+ server: (?=[a-zA-Z0-9-_]{2,32}$)/, "");
                find = this.client.emojis.cache.filter(r => r.name.toLowerCase() === lowReF)?.first();
                if (!find) return inter.reply("Can't find that emoji :c");
            }
        }
        return inter.reply(find.url);
    }
}
