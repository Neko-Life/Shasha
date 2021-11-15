'use strict';

const { Message, GuildMember } = require("discord.js");
const { Command } = require("../../classes/Command");
const { isAdmin, allowMention } = require("../../functions");

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
        inter.member.afk = afk;
        if (this.guild.me.permissions.has("MANAGE_NICKNAMES") && this.member.manageable)
            this.member.setNickname("[AFK] " + this.member.displayName);
        return inter.reply("Okiee i will tell anyone who are looking for you about it! Cyaa enjoy :D");
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
        const m = "**" + member.displayName + " is currently `AFK`"
            + (
                member.afk.message
                    ? (" and left a message:**\n" + member.afk.message)
                    : "**"
            );
        msg.reply({
            content: msg.client.finalizeStr(m, isAdmin(member)),
            allowedMentions: {
                parse: []
            }
        });
        return true;
    }

    static unAfk(msg) {
        if (msg.webhookId) return;
        if (!msg.guild) return;
        if (!msg.member.afk?.state) return;
        msg.reply("I see you're no longer afk, welcome back!");
        if (msg.member.displayName.startsWith("[AFK] "))
            if (msg.guild.me.permissions.has("MANAGE_NICKNAMES") && msg.member.manageable)
                msg.member.setNickname(msg.member.displayName.slice("[AFK] ".length));

        msg.member.afk = {
            state: false,
            mesage: null
        }
    }
}