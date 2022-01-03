'use strict';

const { MessageEmbed } = require("discord.js");
const { logDev } = require("../debug");
const { isAdmin, allowMention, getColor } = require("../functions");
const ArgsParser = require("./ArgsParser");
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

    async method(data) {
        if (data.get?.length)
            return this[data.target]({ method: data });
    }

    async roles(data) {
        if (data.method) {
            const get = {
                description: "Give or take server member roles",
            }
            if (data.method.get)
                return get[data.method.get];
            const set = {
                action: async () => {
                    const inter = data.interaction;
                    inter.deferUpdate();
                    // const prompt = await inter.message.edit({ content: "Provide role mentions, names or Ids separated with ` ` (space) to give/take when the component clicked" });
                    // const collect = await prompt.channel.awaitMessages({ filter: (r) => r.content.length && r.author.id === inter.user.id, max: 1 });
                    // const findRoles = await ArgsParser.roles(inter.guild, collect.content);
                    // const roles = findRoles.roles.filter(r => !r.managed);
                    // await data.message.db.set("action", data.found().customId, {value:{type:"roles",roles:roles.map(r=>r.id),sync:true,action:"give"}});
                    // await prompt.edit({ content: null, embeds: [await data.message.getEmbed()], components: [] });
                    console;
                }
            }
            if (data.method.set)
                return set[data.method.set]();
        }
        const guild = this.client.guilds.resolve(data.guild);
        if (!guild) throw new TypeError("Unknown guild");
        const roles = guild.roles.cache.filter(r => data.roles.some(i => i === r.id) && !r.managed && r.position < guild.me.roles.highest.position);
        if (!roles?.size) throw new TypeError("No available role");
        const member = guild.members.resolve(data.target);
        if (!member) throw new TypeError("Unknown member");
        if (data.interaction) await data.interaction.deferReply(data.noEphemeralReply ? undefined : { ephemeral: true });
        const given = [];
        const taken = [];
        const toGive = roles.filter(r => !member.roles.cache.some(i => i.id === r.id)).map(([k, v]) => v);
        const toTake = member.roles.cache.filter(r => roles.some(i => i.id === r.id)).map(([k, v]) => v);
        const giveRoles = async () => {
            given.push(...(await member.roles.add(toGive)));
        }
        const takeRoles = async () => {
            taken.push(...(await member.roles.remove(toTake)));
        }
        if (!data.action) {
            if (data.sync) {
                if (toGive.length) await giveRoles();
                else if (toTake.length) await takeRoles();
            } else {
                if (toGive.length) await giveRoles();
                if (toTake.length) await takeRoles();
            }
        } else if (data.action === "give" && toGive.length) {
            await giveRoles();
        } else if (data.action === "take" && toTake.length) {
            await takeRoles();
        }
        if (data.interaction) {
            const emb = new MessageEmbed()
                .setAuthor({ name: guild.name, iconURL: guild.iconURL({ size: 128, format: "png", dynamic: true }) })
                .setColor(getColor(member.user.accentColor, true, member.displayColor))
                .setTitle("Role");
            let desc = "";
            if (taken.length) {
                desc += "**Taken:**\n";
                desc += "> <@&" + taken.map(r => r.id).join(">\n> <@&") + ">\n\n";
            }
            if (given.length) {
                desc += "**Given:**\n";
                desc += "> <@&" + given.map(r => r.id).join(">\n> <@&") + ">\n\n";
            }
            desc.length ? emb.setDescription(desc) : emb.setDescription("I don't have the required `MANAGE_ROLES` permission or the will be given/taken roles are in higher position than me for me to manage them :<");
            data.interaction.editReply({ embeds: [emb] });
        }
    }

    async unmute(data) {
        if (data.method) {
            const get = {
                description: "Unmute a muted server member",
            }
            if (data.method.get)
                return get[data.method.get];
            const set = {}
            if (data.method.set)
                return set[data.method.set](data);
        }
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
        if (data.method) {
            const get = {
                description: "Unban a banned user from the server",
            }
            if (data.method.get)
                return get[data.method.get];
            const set = {}
            if (data.method.set)
                return set[data.method.set](data);
        }
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
        if (data.method) {
            const get = {
                description: "Send a reminder message",
            }
            if (data.method.get)
                return get[data.method.get];
            const set = {}
            if (data.method.set)
                return set[data.method.set](data);
        }
        const about = data.about;
        const user = await this.client.findUsers(data.user);
        let channel, member;
        if (data.channel) {
            channel = this.client.channels.resolve(data.channel);
            if (channel)
                member = channel.guild.members.cache.get(data.user) || await channel.guild.members.fetch(data.user).catch(logDev);
        }
        this.client.scheduler.remove(data.job.name);
        const sendUser = async (addition = "") => {
            return user.send("Reminder: " + about + addition).catch(logDev);
        }
        if (channel) {
            if (!channel.permissionsFor(this.client.user).has("SEND_MESSAGES"))
                return sendUser("\n\n_I don't have permission in the channel where you wanted me to notify you so i dm you instead_");
            if (!member)
                return sendUser("\n\n_You're no longer a member in the server you wanted me to notify you in so i dm you instead_");
            const cont = this.client.finalizeStr(`Reminder for <@${user.id}>: ${about}`, isAdmin(member));
            return channel.send({ content: cont, allowedMentions: allowMention({ member: member, content: cont }) });
        } else return sendUser();
    }
}

module.exports = { Actions }