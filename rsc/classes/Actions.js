'use strict';

const { logDev } = require("../debug");
const { Moderation } = require("./Moderation");

class Actions {
    /**
     * 
     * @param {ShaClient} client 
     */
    constructor(client) {
        /**
         *
         * @type {ShaClient} client
         */
        this.client = client;
    }

    async unmute(data) {
        const guild = this.client.guilds.cache.get(data.guild);
        const target = await this.client.findUsers(data.target, "i");
        if (guild && target) {
            const mod = new Moderation(this.client, {
                guild: guild, targets: target, moderator: guild.me
            });
            try {
                await mod.unmute({ invoked: new Date(), reason: "Punishment expired" });
            } catch (e) { logDev(e) };
        }
    }
}

module.exports = { Actions }