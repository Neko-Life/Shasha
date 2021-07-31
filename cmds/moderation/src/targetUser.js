'use strict';

const { Message, User } = require("discord.js");
const { cleanMentionID, findMemberRegEx } = require("../../../resources/functions");

/**
 * @param {Message} msg 
 * @param {string[]} mentions 
 * @param {User[]} targetUser 
 * @param {string} resultMsg 
 * @returns {Promise<{ targetUser: User[], resultMsg: string }>}
 */
module.exports = async (msg, mentions = [], targetUser = [], resultMsg = "") => {
    if (!mentions.length) return { targetUser, resultMsg };
    for (const usermention of mentions) {
        if (usermention.trim().length < 1) continue;
        let found = [],
            nameid = cleanMentionID(usermention);
        if (/^\d{17,19}$/.test(nameid)) {
            const findmem = msg.guild.member(nameid);
            if (findmem) {
                found.push(findmem.user);
            } else {
                await msg.client.users.fetch(nameid).then(fetchUser => found.push(fetchUser)).catch(() => { });
            }
        } else {
            found = findMemberRegEx(msg, nameid)?.map(r => r.user);
        }
        if (found?.length > 0 && found[0] !== null) {
            const foundDupli = targetUser.findIndex(r => r === found[0]);
            if (foundDupli !== -1) {
                resultMsg += `**[WARNING]** Duplicate for user **${targetUser[foundDupli].tag}** with keyword: **${usermention.trim()}**\n`;
            } else {
                targetUser.push(found[0]);
                if (found.length > 1) {
                    resultMsg += `**[WARNING]** Multiple users found for: **${usermention.trim()}**\n`;
                }
            }
        } else {
            resultMsg += `Can't find user: **${usermention.trim()}**\n`;
        }
    }
    return { targetUser, resultMsg };
}