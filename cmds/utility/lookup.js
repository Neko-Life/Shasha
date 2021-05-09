'use strict';

const commando = require("@iceprod/discord.js-commando");
const { cleanMentionID, findMemberRegEx, multipleMembersFound, trySend } = require("../../resources/functions");

module.exports = class lookup extends commando.Command {
    constructor(client) {
        super(client, {
            name: "lookup",
            memberName: "lookup",
            group: "utility",
            description: "Lookup something in the server using mention, ID, or RegExp."
        });
    }
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
        let [fetchedMember, memMes] = [[], ""];
        if (args[0].toLowerCase() === "member") {
            if (args[1]) {
                const memberID = cleanMentionID(arg.slice("member".length).trim());
                if (!/\D/.test(memberID)) {
                    fetchedMember.push(msg.guild.member(memberID));
                }
                if (/\D/.test(memberID) || fetchedMember[0] === null) {
                    fetchedMember = await findMemberRegEx(msg, this.client, memberID);
                }
                if (fetchedMember.length > 1) {
                    memMes = multipleMembersFound(this.client, msg, fetchedMember, memberID, show, true);
                } else {
                    if (fetchedMember.length === 0 || fetchedMember[0] === null) {
                        return trySend(this.client, msg, `No member found for: **${memberID}**`);
                    }
                    memMes = `Member found for: **${memberID}**\`\`\`md\n# ${fetchedMember[0].user.tag} (${fetchedMember[0].user.id})\`\`\``;
                }
            }
        }
        if (memMes.length > 0) {
            return trySend(this.client, msg, memMes);
        }
    }
};