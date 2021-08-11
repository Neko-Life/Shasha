'use strict';

const commando = require("@iceprod/discord.js-commando");
const { MessageEmbed } = require("discord.js");
const { getChannelMessage, errLog, ranLog, trySend, tryReact } = require("../../resources/functions");

module.exports = class cloneembed extends commando.Command {
  constructor(client) {
    super(client, {
      name: "clone-embed",
      aliases: ["clone-emb", "clon-emb", "clon-embed"],
      memberName: "clonemb",
      group: "utility",
      description: "Clone an Embed."
    });
  }
  async run(msg, cargs) {
    const args = cargs.trim().split(/ +/);
    try {
      const theMes = await getChannelMessage(msg, args[0], args[1]);
      let content;
      if (theMes.content) {
        content = theMes.content;
      }
      if (!theMes.embeds || (theMes.embeds).length === 0) {
        return trySend(this.client, msg, 'ypu don\'t know what an embed is? <:cathmmLife:772716381874946068>');
      }
      if (!args[0]) {
        return trySend(this.client, msg, 'Which message??');
      }
      const sent = theMes.embeds.map(r => trySend(this.client, msg, { content: content, embed: r }));
      if (sent) {
        tryReact(msg, "a:yesLife:794788847996370945");
      }
      return sent;
    } catch (e) {
      return trySend(this.client, msg, "No embed found. Use `<channel_[mention, ID]> <message_ID>` if it's in another channel.");
    }
  }
};