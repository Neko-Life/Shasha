"use strict";

const { Util, CommandInteraction } = require("discord.js");
const { Command } = require("../../classes/Command");
const { getChannelMessage, createRegExp } = require("../../functions");
const { inspect } = require("util");
const req = require("axios").default;
const { escapeRegExp } = require("lodash");
const { join } = require("path");
const { logDev } = require("../../debug");

module.exports = class EvalCmd extends Command {
    constructor(interaction) {
        super(interaction, { name: "eval" });
    }

    /**
     * @param {CommandInteraction} inter
     * @param {{script: string, message: string}} param1
     * @returns 
     */
    async run(inter, { script, message, split }) {
        if (!inter.client.isOwner(inter.user)) return inter.reply("Hi daddy");
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

        script = script?.replace(/^```(js)?\n|```$/g, "");

        if (!script) return inter.editReply({ content: "No script OwO", ephemeral: true });
        let mes, bf, af;
        try {
            bf = new Date();
            const res = await eval(script);
            af = new Date();
            mes = inspect(res, this.inspectOpt);
        } catch (e) {
            logDev(e);
            mes = e.stack;
        }
        let send;
        if (mes.length) {
            let re;
            if (/^\/.+\/\w{0,6}$/.test(split?.value)) {
                const sp = split.value.split("/");
                re = createRegExp(sp[1], sp[3] || "");
            } else re = split?.value;
            send = Util.splitMessage("```js\n" + mes + "```",
                {
                    append: "```",
                    prepend: "```js\n",
                    char: (
                        split?.value.toLowerCase() === "none"
                            ? ""
                            : re
                    ) ?? "\n",
                    maxLength: 2000
                }
            );
        }
        const ret = [];
        if (send?.length)
            for (const U of send)
                ret.push(await inter.channel.send(U));
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
