'use strict';

const commando = require("@iceprod/discord.js-commando");
const { MessageEmbed } = require("discord.js");
const { getChannelMessage, errLog, ranLog, trySend, tryReact } = require("../../resources/functions");

module.exports = class clonemb extends commando.Command {
    constructor(client) {
        super(client, {
            name: "clonemb",
            aliases: ["cloneemb","cloneembed", "clonembed"],
            memberName: "clonemb",
            group: "utility",
            description: "Clone an Embed."
        });
    }
    async run(msg, cargs) {
        const args = cargs.trim().split(/ +/);
        const {defaultErrorLogChannel} = require("../../config.json");
        try {
          const theMes = await getChannelMessage(this.client,msg,args[0],args[1]);
          let content;
          if (theMes.content) {
            content = theMes.content;
          }
          if (!theMes.embeds || (theMes.embeds).length === 0) {
            return trySend(this.client, msg, 'No embed found.');
          }
          if (!args[0]) {
            return trySend(this.client, msg, 'Which embed??');
          }
          trySend(this.client, msg, {content:content,embed:theMes.embeds[0]});
          const moreEmb = theMes.embeds.slice(1);
          for(const emb of moreEmb) {
            trySend(this.client, msg, new MessageEmbed(emb));
          }
          tryReact(msg, "a:yesLife:794788847996370945");
          return ranLog(msg,'clonemb',`Embed ${theMes.url} (${theMes.id}) in ${theMes.channel.name} (${theMes.channel.id}) of ${theMes.guild.name} cloned.`);
        } catch (e) {
          return errLog(
              e,
              msg,
              this.client,
              false,
              "No embed found. Use `<channel_[mention, ID]> <message_ID>` if it's in another channel.",
              true
          );
        }
    }
};