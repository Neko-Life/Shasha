'use strict';

const commando = require("@iceprod/discord.js-commando");
const { getUser, errLog, ranLog, trySend } = require("../../resources/functions");

module.exports = class uinfo extends commando.Command {
    constructor(client) {
        super(client, {
            name: "uinfo",
            memberName: "uinfo",
            group: "utility",
            description: "\"Detailed\" Profile."
        });
    }
    async run(msg,  arg ) {
        const args = arg.trim().split(/ +/);
        try {
            let profile;
            if (args[0]) {
                profile = await getUser(this.client, msg, args[0]);
            } else {
                profile = msg.author;
            }
            const member = msg.guild.member(profile);
            let result = 'User: '+profile.tag+'```js\n';
            if (profile) {
                result = result+JSON.stringify(profile).split(',"').join(',\n"').split(',{').join(',\n{')+'```';
            }
            if (member) {
                result = result+'As member: '+member.displayName+'```js\n'+JSON.stringify(member).split(',"').join(',\n"').split(',{').join(',\n{')+'```';
                if ((member.displayColor)) {
                    result = result+'Display color:```js\n'+member.displayColor+'```';
                }
            }
            trySend(this.client, msg, result,{split:{maxLength:2000,char: ", " || ",\n" || ". " || ".\n" || "," || ".",append:',```',prepend:'```js\n'}});
            return ranLog(msg,'profile',msg.content);
        } catch (e) {
            return errLog(e, msg, this.client, false, 'Gimme the right ID!', true);
        }
    }
};