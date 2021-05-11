'use strict';

const commando = require("@iceprod/discord.js-commando");
const { errLog, getChannelMessage, ranLog, noPerm, trySend } = require("../../resources/functions");

module.exports = class mesinfo extends commando.Command {
  constructor(client) {
      super(client, {
          name: "mesinfo",
          memberName: "mesinfo",
          group: "utility",
          description: "Fetch message info."
      });
  }
  async run(msg, arg) {
    const {defaultErrorLogChannel} = require("../../config.json");
      const args = arg.trim().split(/ +/);
      const message = await getChannelMessage(this.client, msg, args[0], args[1]);
      console.log(message);
      if (!message) {
        return trySend(this.client, msg, "No message with that ID <:catstareLife:794930503076675584>")
      } else {
        try {
          const mesinfo = 'Collected:```js\n'+JSON.stringify(message, null, 4).replace(/`/g,"\\`")+'```';
          const mentionJSON = message.mentions.toJSON();
          const sendMentionInfo = 'Mentions:```js\n'+JSON.stringify(mentionJSON, null, 4)+'```';
          const Attachments = 'Attachments:```js\n'+JSON.stringify(message.attachments, null, 4)+'```';
          const sendmesinfo = mesinfo+sendMentionInfo+Attachments;
          const result1 = await trySend(this.client, msg, {content:sendmesinfo,split:{maxLength:2000,char: ", " || ",\n" || ". " || ".\n" || "," || ".",append:',```',prepend:'```js\n'}});
          return ranLog(msg,'mesinfo',`${result1}`);
        } catch (e) {
          noPerm(msg);
          return errLog(e, msg, this.client, false, "", false, defaultErrorLogChannel);
        }
      }
    }
};