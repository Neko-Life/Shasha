'use strict';

const commando = require("@iceprod/discord.js-commando");
const { cleanMentionID, findMemberRegEx, multipleMembersFound, trySend, findRoleRegEx, multipleRolesFound, multipleChannelsFound, findChannelRegEx } = require("../../resources/functions");

module.exports = class lookup extends commando.Command {
    constructor(client) {
        super(client, {
            name: "lookup",
            memberName: "lookup",
            group: "utility",
            description: "Lookup something in the server using mention, ID, or RegExp."
        });
    }
    /**
     * 
     * @param {commando.CommandoMessage} msg 
     * @param {*} arg 
     * @returns 
     */
    async run(msg, arg) {
        let show;
        const showArg = arg.match(/\-\-show *\d*/i);
        if (showArg?.[0]) {
            const digit = showArg[0].match(/\d*/g);
            for (const val of digit) {
                if (val.length > 0) {
                    const res = parseInt(val, 10);
                    show = res;
                }
            }
        }
        arg = arg.replace(/\-\-show *\d*/i, "");
        const args = arg.split(/ +/);
        let [fetchedMember, fetchedRoles, fetchedChannels, memMes] = [[], [], [], ""];
        const lowCaseArg0 = args[0].toLowerCase();
        if (lowCaseArg0 === "role") {
            if (args[1]) {
                const cleanRoleID = cleanMentionID(arg.slice("role".length).trim());
                if (!/\D/.test(cleanRoleID)) {
                    fetchedRoles.push(msg.guild.roles.cache.get(cleanRoleID));
                }
                if (/\D/.test(cleanRoleID) || fetchedRoles[0] == null) {
                    fetchedRoles = findRoleRegEx(msg, cleanRoleID);
                }
                if (fetchedRoles.length > 1) {
                    memMes = multipleRolesFound(this.client, msg, fetchedRoles, cleanRoleID, show, true);
                } else {
                    if (fetchedRoles.length === 0 || fetchedRoles[0] === null) {
                        return trySend(this.client, msg, `No role found for: **${cleanRoleID}**`);
                    }
                    memMes = `Role found for: **${cleanRoleID}**\`\`\`md\n# ${fetchedRoles[0].name} (${fetchedRoles[0].id})\`\`\``;
                }
            }
        } else {
            if (lowCaseArg0 === "channel") {
                if (args[1]) {
                    const cleanChannelID = cleanMentionID(arg.slice("channel".length).trim());
                    if (!/\D/.test(cleanChannelID)) {
                        fetchedChannels.push(msg.guild.roles.cache.get(cleanChannelID));
                    }
                    if (/\D/.test(cleanChannelID) || fetchedChannels[0] == null) {
                        fetchedChannels = findChannelRegEx(msg, cleanChannelID);
                    }
                    if (fetchedChannels.length > 1) {
                        memMes = multipleChannelsFound(this.client, msg, fetchedChannels, cleanChannelID, show, true);
                    } else {
                        if (fetchedChannels.length === 0 || fetchedChannels[0] === null) {
                            return trySend(this.client, msg, `No channel found for: **${cleanChannelID}**`);
                        }
                        memMes = `Channel found for: **${cleanChannelID}**\`\`\`md\n# ${fetchedChannels[0].name} (${fetchedChannels[0].id})\`\`\``;
                    }
                }
            } else {
                if (!/\D/.test(arg)) {
                    fetchedMember.push(msg.guild.member(arg));
                }
                if (/\D/.test(arg) || fetchedMember[0] === null) {
                    fetchedMember = findMemberRegEx(msg, arg);
                }
                if (fetchedMember.length > 1) {
                    memMes = multipleMembersFound(this.client, msg, fetchedMember, arg, show, true);
                } else {
                    if (fetchedMember.length === 0 || fetchedMember[0] === null) {
                        return trySend(this.client, msg, `No member found for: **${arg}**`);
                    }
                    memMes = `Member found for: **${arg}**\`\`\`md\n# ${fetchedMember[0].user.tag} (${fetchedMember[0].user.id})\`\`\``;
                }
            }
        }
        if (memMes.length > 0) {
            return trySend(this.client, msg, memMes);
        }
    }
};