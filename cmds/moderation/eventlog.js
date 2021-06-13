'use strict';

const commando = require("@iceprod/discord.js-commando");
const { getChannelProchedure, trySend, defaultImageEmbed } = require("../../resources/functions");

module.exports = class eventlog extends commando.Command {
    constructor(client) {
        super(client, {
            name: "eventlog",
            aliases: ["eventlogs"],
            memberName: "eventlog",
            group: "moderation",
            description: "Configure server's Event Log Channels.",
            guildOnly: true,
            userPermissions: ["MANAGE_GUILD"]
        });
    }
    async run(msg, arg) {
        if (!msg.guild.dbLoaded) {
            await msg.guild.dbLoad();
        }
        const set = arg.split(/(?<!\\)(--)+/);
        let eventChannels = msg.guild.eventChannels;
        if (!eventChannels) eventChannels = {};
        if (set.length < 2 && set[0].length === 0) return trySend(this.client, msg, await resultEmbed(this));
        let report = "", joinleavelog, channellog, banunbanlog, messagelog = { channel: undefined, ignore: [] }, invitelog, rolelog, guildlog, membernicklog, emotelog, memberroleslog, remove = false, setMessageIgnore = false;
        for (const args of set) {
            const lowArg = args.toLowerCase();
            if (lowArg.startsWith("remove")) remove = true;
            if (lowArg.startsWith("joinleave")) {
                if (remove) eventChannels.joinLeave = undefined; else {
                    joinleavelog = getChannelProchedure(msg, args.slice("joinleaves".length).trim())?.id;
                    if (!joinleavelog) report += "**[JOINLEAVE]** Unknown channel.\n";
                }
            }
            if (lowArg.startsWith("channel")) {
                if (remove) eventChannels.channel = undefined; else {
                    channellog = getChannelProchedure(msg, args.slice("channels".length).trim())?.id;
                    if (!channellog) report += "**[CHANNEL]** Unknown channel.\n";
                }
            }
            if (lowArg.startsWith("banunban")) {
                if (remove) {
                    eventChannels.banUnban = undefined;
                } else {
                    banunbanlog = getChannelProchedure(msg, args.slice("banunbanS".length).trim())?.id;
                    if (!banunbanlog) {
                        report += "**[BANUNBAN]** Unknown channel.\n";
                    }
                }
            }
            if (lowArg.startsWith("message")) {
                if (remove) {
                    eventChannels.message = {
                        channel: undefined,
                        ignore: []
                    }
                } else {
                    const mesArgs = args.slice("message").trim().split(/(?<!\\)-(?!-)/);
                    if (mesArgs.length > 0 && /(?<!\\)-ignore/i.test(lowArg)) {
                        setMessageIgnore = true;
                        for (const mesArg of mesArgs) {
                            if (mesArg.toLowerCase().startsWith("ignore")) {
                                const ignoreArgs = mesArg.slice("ignores".length).trim().split(/(?<!\\),+(?!\d*})/);
                                if (ignoreArgs.length > 0) {
                                    for (const ign of ignoreArgs) {
                                        if (ign.length === 0) {
                                            continue;
                                        }
                                        const chan = getChannelProchedure(msg, ign);
                                        if (chan) {
                                            if (messagelog.ignore.includes(chan.id)) {
                                                report += "**[MESSAGE_CHANNELIGNORE]** Duplicate result: <#" + chan.id +
                                                `> with keyword: **${ign.trim()}**\n`;
                                            } else {
                                                messagelog.ignore.push(chan.id);
                                            }
                                        } else {
                                            report += "**[MESSAGE_CHANNELIGNORE]** Unknown channel: **" + ign.trim() + "**\n";
                                        }
                                    }
                                }
                            }
                        }
                    }
                    const igno = /(?<!\\)-ignore.*/i.test(args);
                    messagelog.channel = getChannelProchedure(msg, args.slice("messages".length).replace(/(?<!\\)-ignore.*/i, "").trim())?.id;
                    if (!messagelog.channel) {
                        if (!igno) {
                            report += "**[MESSAGE]** Unknown channel.\n";
                        } else {
                            report += "**[MESSAGE]** Ignored channels reset!\n"
                        }
                    }
                }
            }
            if (lowArg.startsWith("invite")) {
                if (remove) {
                    eventChannels.invite = undefined;
                } else {
                    invitelog = getChannelProchedure(msg, args.slice("invites".length).trim())?.id;
                    if (!invitelog) {
                        report += "**[INVITE]** Unknown channel.\n";
                    }
                }
            }
            if (lowArg.startsWith("role")) {
                if (remove) {
                    eventChannels.role = undefined;
                } else {
                    rolelog = getChannelProchedure(msg, args.slice("roles".length).trim())?.id;
                    if (!rolelog) {
                        report += "**[ROLE]** Unknown channel.\n";
                    }
                }
            }
            if (lowArg.startsWith("guild")) {
                if (remove) {
                    eventChannels.guild = undefined;
                } else {
                    guildlog = getChannelProchedure(msg, args.slice("guilds".length).trim())?.id;
                    if (!guildlog) {
                        report += "**[GUILD]** Unknown channel.\n";
                    }
                }
            }
            if (lowArg.startsWith("memberprofile")) {
                if (remove) {
                    eventChannels.member = undefined;
                } else {
                    console.log(args);
                    membernicklog = getChannelProchedure(msg, args.slice("members".length).trim())?.id;
                    if (!membernicklog) {
                        report += "**[MEMBERPROFILE]** Unknown channel.\n";
                    }
                }
            }
            if (lowArg.startsWith("emoji")) {
                if (remove) {
                    eventChannels.emote = undefined;
                } else {
                    emotelog = getChannelProchedure(msg, args.slice("emojis".length).trim())?.id;
                    if (!emotelog) {
                        report += "**[EMOJI]** Unknown channel.\n";
                    }
                }
            }
            if (lowArg.startsWith("memberrole")) {
                if (remove) {
                    eventChannels.memberRole = undefined;
                } else {
                    memberroleslog = getChannelProchedure(msg, args.slice("memberroles".length).trim())?.id;
                    if (!memberroleslog) {
                        report += "**[MEMBERROLE]** Unknown channel.\n";
                    }
                }
            }
        }
        async function resultEmbed(the) {
            const emb = await defaultImageEmbed(msg, null, "Event Log Channels Configuration");
            emb
            .setDescription(`Set configuration using \`\`\`js\n${msg.guild.commandPrefix + the.name} [--remove] --<Category> <Channel_[Mention | Name | ID]>\`\`\`**Categories:** \`\`\`js\n[MESSAGE [-ignore <Channel_[Mention | Name | ID]>], JOINLEAVE, MEMBER, MEMBERROLE, BANUNBAN, GUILD, ROLE, CHANNEL, EMOJI, INVITE]\`\`\``)
            .addField(`Message Edit and Delete`, eventChannels?.message?.channel ? `<#${eventChannels?.message.channel}>\n**Ignores:** ${eventChannels?.message?.ignore?.length > 0 ?
            "<#" + eventChannels?.message.ignore.join(">, <#") + ">" : "None"}`
            : "Not set", true)
            .addField(`Member Join and Leave`, eventChannels?.joinLeave ? `<#${eventChannels?.joinLeave}>` : "Not set", true)
            .addField(`Member Profile Updates`, eventChannels?.member ? `<#${eventChannels?.member}>` : "Not set", true)
            .addField(`Member Role Updates`, eventChannels?.memberRole ? `<#${eventChannels?.memberRole}>` : "Not set", true)
            .addField(`Member Ban and Unban`, eventChannels?.banUnban ? `<#${eventChannels?.banUnban}>` : "Not set", true)
            .addField(`Server Updates`, eventChannels?.guild ? `<#${eventChannels?.guild}>` : "Not set", true)
            .addField(`Server Role Updates`, eventChannels?.role ? `<#${eventChannels?.role}>` : "Not set", true)
            .addField(`Server Channels Updates`, eventChannels?.channel ? `<#${eventChannels?.channel}>` : "Not set", true)
            .addField(`Server Emoji Updates`, eventChannels?.emote ? `<#${eventChannels?.emote}>` : "Not set", true)
            .addField(`Server Invites`, eventChannels?.invite ? `<#${eventChannels?.invite}>` : "Not set", true);
            return emb;
        }
        eventChannels = {
            joinLeave: joinleavelog ?? eventChannels?.joinLeave,
            channel: channellog ?? eventChannels?.channel,
            banUnban: banunbanlog ?? eventChannels?.banUnban,
            message: {
                channel: messagelog.channel ?? eventChannels?.message?.channel,
                ignore: setMessageIgnore ? messagelog.ignore : eventChannels?.message?.ignore
            },
            invite: invitelog ?? eventChannels?.invite,
            role: rolelog ?? eventChannels?.role,
            guild: guildlog ?? eventChannels?.guild,
            member: membernicklog ?? eventChannels?.member,
            emote: emotelog ?? eventChannels?.emote,
            memberRole: memberroleslog ?? eventChannels?.memberRole
        }
        const r = await msg.guild.setEventChannels(eventChannels);
        if (r) {
            report += "Event Log Channels set!\n";
            report += "\n**SUMMARY:**";
        }
        return trySend(this.client, msg, (await resultEmbed(this)).setDescription(report.slice(0, 2048)));
    }
};