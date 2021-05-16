'use strict';
const commando = require("@iceprod/discord.js-commando");
const { ranLog, errLog, trySend, sentAdCheck, tryReact } = require("../../resources/functions");

module.exports = class send extends commando.Command {
    constructor(client) {
        super(client, {
            name: "send",
            memberName: "send",
            group: "utility",
            description: "Send message to designated channel.",
            userPermissions:"MANAGE_MESSAGES"
        });
    }
    async run(msg, args ) {
        const comarg = args.trim().split(/ +/);
        const bot = this.client;
        let at = comarg[0];
        if (!comarg[0]) {
          return trySend(this.client, msg, 'Where?!?');
        }
        if (comarg[0].startsWith('<#') && comarg[0].endsWith('>')) {
          at = comarg[0].slice(2, -1);
        }
        const channel = bot.channels.cache.get(at);
        const sendTheMes = args.slice(comarg[0].length).trim();
        if (!channel) {
          return trySend(this.client, msg, "Give me the right `channel_[mention, ID]` bruh");
        }
        try {
          if (sendTheMes.length === 0) {
            return trySend(this.client, at, `<@!${msg.author.id}> If you wanna send nothin then why you even typed that <:bruhLife:798789686242967554>`);
          }
          const sendThis = {content:sendTheMes, disableMentions:"all"};
          if (msg.member?.hasPermission("ADMINISTRATOR")) {
            sendThis.disableMentions = "none";
          }
          const send = await trySend(this.client, msg, sendThis);
          sentAdCheck(send);
          const filter = () => true;
          const collector = send.createReactionCollector(filter, {time: 15*6*1000, dispose:true});
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