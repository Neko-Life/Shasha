'use strict';

const { Command } = require("../classes/Command");

module.exports = class EvalCmd extends Command {
    constructor(interaction) {
        super(interaction, { name: "eval" });
    }

    async run(inter, { script }) {
        if (!inter.client.owners.includes(inter.user)) return inter.editReply("wat");
        return inter.editReply("```js\n" + JSON.stringify(eval(script.value), null, 2) + "```");
    }
}