'use strict';

const commando = require("@iceprod/discord.js-commando");
const { trySend, cleanMentionID, findMemberRegEx } = require("../../resources/functions");

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
            let profile;
            if (arg.length > 0) {
                const hmm = cleanMentionID(arg);
                if (/^\d{17,19}$/.test(hmm)) {
                    profile = this.client.users.cache.get(hmm);
                    if (!profile) {
                        profile = await this.client.users.fetch(hmm);
                    }
                } else {
                    profile = findMemberRegEx(msg, hmm)[0].user;
                }
            } else {
                profile = msg.author;
            }
            const member = msg.guild.member(profile);
            let result = "";
            if (profile) {
                result += 'User: '+profile.tag+'```js\n' + JSON.stringify(profile, (k, v) => v || undefined, 2)+'```';
            }
            if (member) {
                result += 'As member: '+member.displayName+'```js\n'+JSON.stringify(member, (k, v) => v || undefined, 2)+'```';
                if ((member.displayColor)) {
                    result += 'Display color:```js\n'+member.displayColor+'```';
                }
            }
            return trySend(this.client, msg, { content: result, split:{ maxLength: 2000, char: "", append: '```', prepend: '```js\n' }});
        } catch (e) {
            return trySend(this.client, msg, "404 ERROR not found~");
        }
    }
};