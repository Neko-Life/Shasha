'use strict';

const { logDev } = require("../debug");
const { isAdmin, allowMention } = require("../functions");
const { Moderation } = require("./Moderation");

const ENUM_ACTION_TARGET_TYPES = {
    "user": 1,
    "channel": 2,
    "guild": 3,
    "member": 4,
}

/**
 * @typedef {object} BaseActionData
 * @property {keyof Actions} action
 * @property {keyof ENUM_ACTION_TARGET_TYPES} targetType
 * @property {string} target - Id
 * @property {string} [guild=null] - Id
 * @property {string} [channel=null] - Id
 * @property {string} [user=null] - Id
 * 
 * @typedef {object} RemindExtendActionData
 * @property {string} about
 * 
 * @typedef {RemindExtendActionData & BaseActionData} RemindActionData
 */

class Actions {
    /**
     * 
     * @param {import("./ShaClient")} client 
     */
    constructor(client) {
        /**
         *
         * @type {import("./ShaClient")} client
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
            // try {
            await mod.unmute({ invoked: new Date(), reason: "Punishment expired" });
            // } catch (e) { logDev(e) };
        }
    }

    async unban(data) {
        const guild = this.client.guilds.cache.get(data.guild);
        const target = await this.client.findUsers(data.target);
        if (guild && target) {
            const mod = new Moderation(this.client, {
                guild: guild, targets: target, moderator: guild.me
            });
            // try {
            await mod.unban({ invoked: new Date(), reason: "Punishment expired" });
            // } catch (e) { logDev(e) };
        }
    }

    /**
     * 
     * @param {RemindActionData} data 
     */
    async remind(data) {
        const about = data.about;
        const user = await this.client.findUsers(data.user);
        let channel, member;
        if (data.channel) {
            channel = this.client.channels.resolve(data.channel);
            if (channel)
                member = channel.guild.members.cache.get(data.user) || await channel.guild.members.fetch(data.user).catch(logDev);
        }
        this.client.scheduler.remove(data.job.name);
        if (channel) {
            if (!channel.permissionsFor(this.client.user).has("SEND_MESSAGES"))
                return sendUser("\n\n_I don't have permission in the channel where you wanted me to notify you so i dm you instead_");
            if (!member)
                return sendUser("\n\n_You're no longer a member in the server you wanted me to notify you in so i dm you instead_");
            const cont = this.client.finalizeStr(`Reminder for <@${user.id}>: ${about}`, isAdmin(member));
            return channel.send({ content: cont, allowedMentions: allowMention({ member: member, content: cont }) });
        } else return sendUser();
        async function sendUser(addition = "") {
            return user.send("Reminder: " + about + addition).catch(logDev);
        }
    }
}

module.exports = { Actions }