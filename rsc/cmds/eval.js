'use strict';

const { Util, CommandInteraction } = require("discord.js");
const { Command } = require("../classes/Command");
const { getChannelMessage } = require("../functions");
const { inspect } = require("util");

module.exports = class EvalCmd extends Command {
    constructor(interaction) {
        super(interaction, { name: "eval" });
    }

    /**
     * @param {CommandInteraction} inter 
     * @param {*} param1 
     * @returns 
     */
    async run(inter, { script, message }) {
        if (!inter.client.owners.includes(inter.user)) return inter.reply("wat");
        await inter.deferReply({ ephemeral: true });
        if (message) {
            if (["l", "last"].includes(message.value.toLowerCase()))
                script = inter.channel.lastMessage.content;
            else {
                const SP = message.value.split(/ +/);
                script = (await getChannelMessage(inter, SP[0], SP[1]))?.content;
            }
        } else script = script?.value;
        if (!script) return inter.editReply({ content: "No script OwO", ephemeral: true });
        let mes, bf, af;
        try {
            bf = new Date();
            const res = await eval(script);
            af = new Date();
            mes = inspect(res, {
                compact: false,
                depth: 1,
                getters: true,
                maxArrayLength: 249,
                sorted: true,
                maxStringLength: 2000,
                showHidden: false
            });
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
        if (send?.length) for (const U of send) {
            const push = await inter.channel.send(U);
            ret.push(push);
        }
        await inter.editReply({
            content: af && bf
                ? "```js\nExecuted in " + ((af.valueOf() - bf.valueOf()) / 1000) + " s```"
                : "```js\nError```", ephemeral: true
        });
        return ret;
    }
}