'use strict';

const { Message, GuildMember, CommandInteraction } = require("discord.js");
const { Command } = require("../../classes/Command");
const { isAdmin } = require("../../functions");
const NO_LONGER_AFK_MSG = "I see you're no longer afk, welcome back!";

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
        const ret = await inter.reply({
            content: "Okiee i will tell anyone who are looking for you about it! Cyaa enjoy :D",
            fetchReply: true
        });
        setTimeout(() => ret.deleted ? null : ret.delete(), 15000);
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
        if (!member?.afk?.state) return false;
        if (msg.member.id === member.id) return false;
        const m = "**" + member.displayName + "** is **currently `AFK`**"
            + (
                member.afk.message
                    ? (" and left a message:\n" + member.afk.message)
                    : ""
            );
        msg.reply({
            content: msg.client.finalizeStr(m, isAdmin(member)),
            allowedMentions: {
                parse: []
            }
        });
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
        if (msg.channel.permissionsFor(msg.guild.me).has("SEND_MESSAGES"))
            if (msg instanceof CommandInteraction)
                greet = msg.channel.send("<@" + msg.user.id + "> " + NO_LONGER_AFK_MSG);
            else greet = msg.reply({ content: NO_LONGER_AFK_MSG, allowedMentions: { parse: [] } });

        if (msg.member.displayName.startsWith("[AFK] "))
            if (msg.guild.me.permissions.has("MANAGE_NICKNAMES") && msg.member.manageable)
                msg.member.setNickname(msg.member.displayName.slice("[AFK] ".length));

        msg.member.afk = {
            state: false,
            mesage: null
        }

        if (!greet) return;
        setTimeout(() => greet.then(r => r.deleted ? null : r.delete()), 15000);
    }
}