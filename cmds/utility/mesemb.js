'use strict';

const commando = require("@iceprod/discord.js-commando");
const { getChannelMessage, trySend } = require("../../resources/functions");

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
      const message = await getChannelMessage(msg, args[0], args[1]);
      if (!message) {
        return trySend(this.client, msg, "404 message not found!");
      }
      const mesemb = '```js\n' + JSON.stringify(message.embeds, (k, v) => v || undefined, 2).replace(/```/g,"`\\``") + '```';
      return trySend(this.client, msg, { content: 'Collected:' + mesemb, split: { maxLength: 2000, char: "", append: '```', prepend:'```js\n' }});
    }
};