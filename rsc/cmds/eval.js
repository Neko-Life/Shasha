'use strict';

const { Util, CommandInteraction } = require("discord.js");
const { Command } = require("../classes/Command");

module.exports = class EvalCmd extends Command {
    constructor(interaction) {
        super(interaction, { name: "eval" });
    }

    /**
     * @param {CommandInteraction} inter 
     * @param {*} param1 
     * @returns 
     */
    async run(inter, { script }) {
        if (!inter.client.owners.includes(inter.user)) return inter.reply("wat");
        await inter.deferReply({ ephemeral: true });
        let mes;
        try {
            const U = await eval(script.value);
            mes = JSON.stringify(U, null, 2) || "undefined";
        } catch (e) {
            mes = e.stack;
        }
        let send;
        if (mes.length) {
            send = Util.splitMessage("```js\n" + mes + "```",
                {
                    append: "```",
                    prepend: "```js\n",
                    char: ",",
                    maxLength: 2000
                }
            );
        }
        const ret = [];
        if (send.length) for (const U of send) {
            const push = await inter.channel.send(U);
            ret.push(push);
        }
        await inter.editReply({ content: "```js\n" + script.value + "```", ephemeral: true });
        return ret;
    }
}