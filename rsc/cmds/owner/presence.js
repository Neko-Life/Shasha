'use strict';

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
        if (afk) status.afk = afk.value;
        const act = {};
        if (title) act.name = title.value;
        if (type) act.type = type.value;
        if (url) act.url = url.value;
        if (Object.keys(act).length) use.activities = [act];
        const ret = inter.client.user.setPresence(use);
        await inter.editReply("Done");
        return ret;
    }
}