'use strict';

const { Message, GuildMember, CommandInteraction } = require("discord.js");
const { Command } = require("../../classes/Command");
const { isAdmin } = require("../../functions");
const NO_LONGER_AFK_MSG = "Welcome back ";

module.exports = class AFKCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "afk",
            guildOnly: true
        });
    }

    run(inter, { message }) {
        const afk = {
            state: true,
            message: message?.value
        }
        this.member.afk = afk;
        if (!this.member.displayName.startsWith("[AFK] "))
            if (this.guild.me.permissions.has("MANAGE_NICKNAMES") && this.member.manageable)
                this.member.setNickname("[AFK] " + this.member.displayName);
        const ret = inter.reply({
            content: "Okiee i will tell anyone who are looking for you about it! Cyaa enjoy!",
            fetchReply: true
        });
        setTimeout(() => ret.then(r => r.deleted ? null : r.delete()), 15000);
        return ret;
    }

    /**
     * 
     * @param {Message} msg 
     */
    static pinged(msg) {
        if (msg.author.bot) return;
        if (msg.webhookId) return;
        if (!msg.guild) return;
        if (msg.mentions.everyone) return;
        if (msg.mentions.repliedUser) {
            const replied = msg.guild.members.resolve(msg.mentions.repliedUser);
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
    static notif(member, msg) {
        if (msg.author.bot) return false;
        if (!member?.afk?.state) return false;
        if (msg.member.id === member.id) return false;
        const m = "**" + member.displayName + "** is **currently `AFK`**"
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
        setTimeout(() => ret.then(r => r.deleted ? null : r.delete()), 45000);
        return true;
    }

    /**
     * 
     * @param {CommandInteraction | Message} msg
     * @returns {void}
     */
    static async unAfk(msg) {
        if (msg.author?.bot) return;
        if (!msg.guild) return;
        if (!msg.member.afk?.state) return;
        let greet;
        const dN = msg.member.displayName.startsWith("[AFK] ")
            ? msg.member.displayName.slice("[AFK] ".length)
            : msg.member.displayName;

        if (msg.channel.permissionsFor(msg.guild.me).has("SEND_MESSAGES")) {
            if (msg instanceof CommandInteraction)
                greet = msg.channel.send(NO_LONGER_AFK_MSG + dN + "!");
            else greet = msg.reply({ content: NO_LONGER_AFK_MSG + dN + "!", allowedMentions: { parse: [] } });
        }

        if (msg.member.displayName !== dN)
            if (msg.guild.me.permissions.has("MANAGE_NICKNAMES") && msg.member.manageable)
                msg.member.setNickname(dN);

        msg.member.afk = {
            state: false,
            mesage: null
        }

        if (!greet) return;
        setTimeout(() => greet.then(r => r.deleted ? null : r.delete()), 15000);
    }
}