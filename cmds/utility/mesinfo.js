'use strict';

const commando = require("@iceprod/discord.js-commando");
const { getChannelMessage, trySend } = require("../../resources/functions");

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
    const args = arg.trim().split(/ +/);
    const message = await getChannelMessage(this.client, msg, args[0], args[1]);
    if (!message) {
      return trySend(this.client, msg, "No message with that ID <:catstareLife:794930503076675584>")
    }
    const mesinfo = 'Collected:```js\n'+JSON.stringify(message, null, 2).replace(/`/g,"\\`")+'```';
    const mentionJSON = message.mentions.toJSON();
    const sendMentionInfo = 'Mentions:```js\n'+JSON.stringify(mentionJSON, null, 2)+'```';
    const Attachments = 'Attachments:```js\n'+JSON.stringify(message.attachments, null, 2)+'```';
    const sendmesinfo = mesinfo+sendMentionInfo+Attachments;
    return trySend(this.client, msg, {content:sendmesinfo,split:{maxLength:2000,char: ",",append:',```',prepend:'```js\n'}});
  }
};