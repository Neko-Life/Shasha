'use strict';

const commando = require("@iceprod/discord.js-commando");
const { ranLog, trySend, cleanMentionID, findMemberRegEx } = require("../../resources/functions");

module.exports = class uinfo extends commando.Command {
    constructor(client) {
        super(client, {
            name: "uinfo",
            memberName: "uinfo",
            group: "utility",
            description: "\"Detailed\" Profile."
        });
    }
    async run(msg,  arg) {
        try {
            let profile,
            hmm;
            if (arg.length > 0) {
                hmm = cleanMentionID(arg);
                if (/^\d{17,19}$/.test(hmm)) {
                    profile = this.client.users.cache.get(hmm);
                } else {
                    profile = findMemberRegEx(msg, hmm)[0].user;
                }
            } else {
                profile = msg.author;
            }
            const member = msg.guild.member(profile);
            let result = 'User: '+profile.tag+'```js\n';
            if (profile) {
                result = result+JSON.stringify(profile, null, 2)+'```';
            }
            if (member) {
                result = result+'As member: '+member.displayName+'```js\n'+JSON.stringify(member, null, 2)+'```';
                if ((member.displayColor)) {
                    result = result+'Display color:```js\n'+member.displayColor+'```';
                }
            }
            trySend(this.client, msg, result, {split:{maxLength:2000,char: ", " || ",\n" || ". " || ".\n" || "," || ".",append:',```',prepend:'```js\n'}});
            return ranLog(msg,'profile', msg.content);
        } catch (e) {
            return trySend(this.client, msg, "Ya lookin for ya lover? 404 not found.");
        }
    }
};