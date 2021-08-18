'use strict';

const { Command } = require("../classes/Command");

module.exports = class EvalCmd extends Command {
    constructor(interaction) {
        super(interaction, { name: "eval" });
    }

    async run(inter, { script }) {
        if (!inter.client.owners.includes(inter.user)) return inter.editReply("wat");
        let send;
        try {
            console.log(script.value);
            const U = eval(script.value);
            send = JSON.stringify(U, null, 2);
        } catch (e) {
            send = e.stack;
        }
        return inter.reply("```js\n" + send + "```");
    }
}