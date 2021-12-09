'use strict';

const { Message, GuildMember, CommandInteraction } = require("discord.js");
const { Command } = require("../../classes/Command");
const { loadDb } = require("../../database");
const { isAdmin } = require("../../functions");
const { intervalToStrings, createInterval } = require("../../util/Duration");
const NO_LONGER_AFK_MSG = "Welcome back ";

module.exports = class AFKCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "afk",
            guildOnly: true,
            deleteSavedMessagesAfter: 15000
        });
    }

    async run(inter, { message }) {
        const afk = {
            state: true,
            message: message?.value,
            since: new Date()
        };
        await AFKCmd.setAfk(this.member, afk);
        if (!this.member.displayName.startsWith("[AFK] "))
            if (this.guild.me.permissions.has("MANAGE_NICKNAMES") && this.member.manageable)
                this.member.setNickname("[AFK] " + this.member.displayName);
        const ret = inter.reply({
            content: "Okiee i will tell anyone who are looking for you about it! Cyaa enjoy!",
            fetchReply: true
        });
        return this.saveMessages(ret);
    }

    /**
     * 
     * @param {Message} msg 
     */
    pinged(msg) {
        if (msg.author.bot) return;
        if (msg.webhookId) return;
        if (!msg.guild) return;
        if (msg.mentions.everyone) return;
        if (msg.mentions.repliedUser) {
            const replied = msg.guild.members.resolve(msg.mentions.repliedUser);
            if (!replied) return;
            if (this.notif(replied, msg)) return;
        }
        if (msg.mentions.roles.size) return;
        if (!msg.mentions.members.size) return;
        for (const [k, v] of msg.mentions.members)
            this.notif(v, msg);
    }

    /**
     * 
     * @param {GuildMember} member 
     * @param {Message} msg 
     * @returns 
     */
    async notif(member, msg) {
        if (!msg.author) return;
        if (msg.author.bot) return false;
        if (msg.member.id === member.id) return false;
        if (!msg.channel.permissionsFor(msg.guild.me).has("SEND_MESSAGES")) return;
        await AFKCmd.loadAfk(member);
        if (!member?.afk?.state) return false;
        const m = "**" + member.displayName + "** is **currently `AFK`** "
            + (`since ${intervalToStrings(createInterval(member.afk.since, new Date())).strings.join(" ")} ago`)
            + (
                member.afk.message
                    ? (" and left a message:\n" + member.afk.message)
                    : ""
            );
        const ret = msg.reply({
            content: msg.client.finalizeStr(m, isAdmin(member)),
            allowedMentions: {
                parse: []
            }
        });
        ret.deleteAfter = 45000;
        return this.saveMessages(ret);
    }

    /**
     * 
     * @param {CommandInteraction | Message} msg
     * @returns {void}
     */
    async unAfk(msg) {
        if (msg.author?.bot) return;
        if (!msg.guild) return;
        if (msg.commandPath?.[1] === "afk") return;
        await AFKCmd.loadAfk(msg.member);
        if (!msg.member.afk?.state) return;
        let greet;
        const dN = msg.member.displayName.startsWith("[AFK] ")
            ? msg.member.displayName.slice("[AFK] ".length)
            : msg.member.displayName;

        if (msg.channel.permissionsFor(msg.guild.me).has("SEND_MESSAGES")) {
            if (msg instanceof CommandInteraction)
                greet = msg.channel.send(
                    msg.client.finalizeStr(NO_LONGER_AFK_MSG + dN + "!", isAdmin(msg.member))
                );
            else greet = msg.reply({
                content: msg.client.finalizeStr(NO_LONGER_AFK_MSG + dN + "!", isAdmin(msg.member)),
                allowedMentions: { parse: [] }
            });
        }

        if (msg.member.displayName !== dN)
            if (msg.guild.me.permissions.has("MANAGE_NICKNAMES") && msg.member.manageable)
                msg.member.setNickname(dN);

        AFKCmd.removeAfk(msg.member);

        if (!greet) return;
        return this.saveMessages(greet);
    }

    static async loadAfk(member) {
        if (member.afk) return member;
        const gd = loadDb(member, "member/" + member.guild.id + "/" + member.id);
        const get = await gd.db.getOne("afkState", "Object");
        const data = get?.value || {};
        member.afk = data;
        return member;
    }

    /**
     * 
     * @param {*} member 
     * @param {{state: boolean, message: string}} data 
     */
    static setAfk(member, data) {
        const gd = loadDb(member, "member/" + member.guild.id + "/" + member.id);
        member.afk = data;
        gd.db.set("afkState", "Object", { value: data });
        return member;
    }

    static removeAfk(member) {
        const gd = loadDb(member, "member/" + member.guild.id + "/" + member.id);
        member.afk = {};
        gd.db.set("afkState", "Object", { value: member.afk });
        return member;
    }
}