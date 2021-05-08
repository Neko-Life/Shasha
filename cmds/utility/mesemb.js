'use strict';

const commando = require("@iceprod/discord.js-commando");
const { getChannelMessage, ranLog, errLog, noPerm } = require("../../resources/functions");

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
          const mesemb = '```js\n'+JSON.stringify(message.embeds).split(',"').join(',\n"').split(',{').join(',\n{').replace(/`/g,"\\`")+'```';
          const result = msg.channel.send({content:'Collected:'+mesemb,split:{maxLength:2000,char: ", " || ",\n" || ". " || ".\n" || "," || ".",append:',```',prepend:'```js\n'}});
          return ranLog(msg,'mesemb',await result.content);
        } catch (e) {
          noPerm(msg);
          return errLog(e, msg, this.client);
        }
    }
};