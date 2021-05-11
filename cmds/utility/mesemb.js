'use strict';

const commando = require("@iceprod/discord.js-commando");
const { getChannelMessage, ranLog, errLog, noPerm, trySend } = require("../../resources/functions");

module.exports = class mesemb extends commando.Command {
    constructor(client) {
        super(client, {
            name: "mesemb",
            memberName: "mesemb",
            group: "utility",
            description: "Fetch embed info in a message."
        });
    }
    async run(msg, arg) {
        const args = arg.trim().split(/ +/);
        try {
          const message = await getChannelMessage(this.client,msg,args[0],args[1]);
          console.log(message.embeds);
          const mesemb = '```js\n'+JSON.stringify(message.embeds, null, 2)+'```';
          const result = await trySend(this.client, msg, {content:'Collected:'+mesemb,split:{maxLength:2000,char: ", " || ",\n" || ". " || ".\n" || "," || ".",append:',```',prepend:'```js\n'}});
          return ranLog(msg,'mesemb',result.content);
        } catch (e) {
          noPerm(msg);
          return errLog(e, msg, this.client);
        }
    }
};