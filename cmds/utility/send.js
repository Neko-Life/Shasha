'use strict';
const commando = require("@iceprod/discord.js-commando");
const { ranLog, errLog, trySend, sentAdCheck, tryReact, findChannelRegEx, cleanMentionID } = require("../../resources/functions");

module.exports = class send extends commando.Command {
    constructor(client) {
        super(client, {
            name: "send",
            memberName: "send",
            group: "utility",
            description: "Send message to designated channel.",
            guildOnly:true
        });
    }
    async run(msg, args ) {
        const comarg = args.trim().split(/ +/);
        let at = comarg[0];
        if (!comarg[0]) {
          return trySend(this.client, msg, 'Where?!?');
        }
        const search = cleanMentionID(comarg[0]),
        channel = findChannelRegEx(msg, search)[0],
        sendTheMes = args.slice(comarg[0].length).trim();
        if (!channel) {
          return trySend(this.client, msg, "That channel is like your gf. Doesn't exist <:cathmmLife:772716381874946068>");
        } else {
          if (!channel.permissionsFor(msg.author).has("SEND_MESSAGES")) {
            return trySend(this.client, msg, "No <:cathmmLife:772716381874946068>");
          }
        }
        try {
          if (sendTheMes.length === 0) {
            return trySend(this.client, channel, `<@!${msg.author.id}> If you wanna send nothin then why you even typed that <:bruhLife:798789686242967554>`);
          }
          const sendThis = {content:sendTheMes, disableMentions:"all"};
          if (msg.member?.hasPermission("MENTION_EVERYONE")) {
            sendThis.disableMentions = "none";
          }
          const send = await trySend(this.client, channel, sendThis);
          sentAdCheck(send);
          const filter = () => true,
          collector = send.createReactionCollector(filter, {time: 15*6*1000, dispose:true});
          collector.on('collect', r => {
            try {
              msg.react(r.emoji);
            } catch (e) {}
          });
          collector.on('remove', async r => await msg.reactions.resolve(r).id.remove(r.id));
          tryReact(msg, 'yeLife:796401669188354090');
          return ranLog(msg,'send',`ID: ${send.id} url: ${send.url}\nSent to channel: ${channel.name} (${channel.id}) of ${send.guild.name}\nContent: ${args.slice(at.length)}`);
        } catch (e) {
          return errLog(e, msg, this.client);
        }        
    }
};