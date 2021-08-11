'use strict';

const commando = require("@iceprod/discord.js-commando"),
    { getMember, trySend, defaultImageEmbed, getChannel } = require("../../resources/functions");
const { Message, GuildChannel } = require("discord.js");
const getColor = require("../../resources/getColor");

module.exports = class perms extends commando.Command {
    constructor(client) {
        super(client, {
            name: "perms",
            memberName: "perms",
            aliases: ["perm", "permissions", "permission"],
            group: "utility",
            description: "description",
            guildOnly: true
        });
    }
    /**
     * 
     * @param {Message} msg 
     * @param {String} arg 
     * @returns 
     */
    run(msg, arg) {
        let member, channel, mes = "";
        if (arg) {
            const forC = arg.match(/(?<!\\)--ch [^ ]*/)?.[0];
            if (forC) {
                const use = forC.slice(4).trim();
                channel = getChannel(msg, use);
                if (!channel || !(channel instanceof GuildChannel)) {
                    channel = undefined;
                    mes += "Channel unexisted!?\n";
                }
            }
            const find = arg.replace(/(?<!\\)--ch [^ ]*\s?/, "");
            if (find.length > 0) {
                member = getMember(msg.guild, find)?.[0];
            } else {
                member = msg.member;
            }
        } else {
            member = msg.member;
            mes += `Args:\n\`user_[mention|ID|name]\` \`--ch\` \`[channel_[name|ID]|here]\`\n\n`;
        }
        if (!member) {
            return trySend(this.client, msg, "Is that your gf?");
        }
        const perms = member.permissions.serialize();
        let res = [], chanres = [];
        for (const key in perms) {
            const element = perms[key];
            if (element) {
                res.push(key);
            }
        }
        if (channel) {
            const res = channel.permissionsFor(member).serialize();
            for (const key in res) {
                const el = res[key];
                if (el) {
                    chanres.push(key);
                }
            }
        }
        const title = `Permissions for: \`${member.user.tag}\``;
        mes += `**Default:**\`\`\`js\n`;
        if (res.length > 0) {
            mes += `${res.join(", ")}\`\`\``;
        } else {
            mes += `NONE LMFAOO\`\`\``;
        }
        const emb = defaultImageEmbed(msg, null, title);
        if (chanres.length > 0) {
            emb.addField(`In channel: \`${channel.name}\``, `\`\`\`js\n${chanres.join(", ")}\`\`\``);
        }
        emb.setDescription(mes.replace("ADMINISTRATOR", "'ADMINISTRATOR'"))
            .setColor(getColor(member.displayColor))
            .setThumbnail(member.user.displayAvatarURL({ size: 4096, format: "png", dynamic: true }));
        return trySend(this.client, msg, emb);
    }
};