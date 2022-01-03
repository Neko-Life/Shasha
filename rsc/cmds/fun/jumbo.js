'use strict';

const { Command } = require("../../classes/Command");

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
        let find = this.client.emojis.resolve(emoji.value.match(/\d{17,20}/)?.[0] || emoji.value);
        if (!find) {
            const match = emoji.value.match(/[a-zA-Z0-9-_]{1,32}/g);
            const reF = match?.[match.length - 1];
            if (!reF) return inter.reply("Invalid input. Provide emoji name, Id, or the emoji itself");
            const lowReF = reF.toLowerCase().replace(/^.+ server: (?=[a-zA-Z0-9-_]{1,32}$)/, "");
            find = this.client.emojis.cache.filter(r => r.name.toLowerCase() === lowReF)?.first();
            if (!find) return inter.reply("Can't find that emoji :c");
        }
        return inter.reply(find.url);
    }
}