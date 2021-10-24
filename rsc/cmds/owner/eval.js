'use strict';

const { Util, CommandInteraction } = require("discord.js");
const { Command } = require("../../classes/Command");
const { getChannelMessage } = require("../../functions");
const { inspect } = require("util");

module.exports = class EvalCmd extends Command {
    constructor(interaction) {
        super(interaction, { name: "eval" });
    }

    /**
     * @param {CommandInteraction} inter 
     * @param {{script: string, message: string}} param1 
     * @returns 
     */
    async run(inter, { script, message }) {
        if (!inter.client.isOwner(inter.user)) return inter.reply("wat");
        const LM = inter.channel.lastMessage;
        await inter.deferReply({ ephemeral: true });
        if (message) {
            if (["l", "last"].includes(message.value.toLowerCase()))
                script = LM.content;
            else {
                const SP = message.value.split(/ +/);
                script = (await getChannelMessage(inter, SP[0], SP[1]))?.content;
            }
        } else script = script?.value;

        if (typeof script === "string") script = script.replace(/^```(js)?\n|```$/g, "");

        if (!script) return inter.editReply({ content: "No script OwO", ephemeral: true });
        let mes, bf, af;
        try {
            bf = new Date();
            const res = await eval(script);
            af = new Date();
            mes = inspect(res, this.inspectOpt);
        } catch (e) {
            mes = e.stack;
        }
        let send;
        if (mes.length) {
            send = Util.splitMessage("```js\n" + mes + "```",
                {
                    append: "```",
                    prepend: "```js\n",
                    char: "\n",
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
    /**
     * @type {import("util").InspectOptions}
     */
    inspectOpt = {
        compact: false,
        depth: 1,
        getters: true,
        maxArrayLength: 249,
        sorted: true,
        maxStringLength: 5000,
        showHidden: false,
        getters: true,
        breakLength: 2000
    }
}