"use strict";

const { CommandInteraction } = require("discord.js");
const { Command } = require("../../classes/Command");

module.exports = class PresenceCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "presence",
            description: "Set my presence",
            ownerOnly: true
        });
    }
    /**
     * 
     * @param {CommandInteraction} inter 
     * @param {*} param1 
     */
    async run(inter, { status, type, title, url, afk }) {
        await inter.deferReply({ ephemeral: true });
        /**
         * @type {import("discord.js").PresenceData}
         */
        const use = {};
        if (status) use.status = status.value;
        if (afk) use.afk = afk.value;
        const act = {};
        if (title) {
            const toEval = title.value.match(/(?<!\\)(?<=\$\{).+(?=\})/g);
            if (toEval?.length) {
                const rep = [];
                for (const k of toEval) {
                    const data = { name: k };
                    data.value = await eval(k);
                    rep.push(data);
                }
                for (const k of rep)
                    title.value = title.value.replace("${" + k.name + "}", k.value);
            }
            act.name = title.value;
        }
        if (type) act.type = type.value;
        if (url) act.url = url.value;
        if (Object.keys(act).length) use.activities = [act];
        const ret = inter.client.user.setPresence(use);
        await inter.editReply("Done");
        return ret;
    }
}
