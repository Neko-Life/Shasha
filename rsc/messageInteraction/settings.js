'use strict';

const { Message, Guild, MessageCollector, GuildTextBasedChannel, MessageCollectorOptions } = require("discord.js");
const ShaClient = require("../classes/ShaClient");

module.exports = class SettingsButtonInteractionHandler {
    /**
     * 
     * @param {Message} message 
     */
    constructor(message) {
        /**
         * @type {GuildTextBasedChannel}
         */
        this.channel = message.channel;
        /**
         * @type {Guild}
         */
        this.guild = message.guild;
        /**
         * @type {ShaClient}
         */
        this.client = message.client;
        /**
         * @type {Message}
         */
        this.message = message;
    }

    async set(arg) {
        const collect = await this.channel.awaitMessages({ max: 1, time: 60 });
        collect.first();
    }
}