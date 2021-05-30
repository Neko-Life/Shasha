'use strict';
const commando = require("@iceprod/discord.js-commando");
const emoteMessage = require("../../resources/emoteMessage");
const { ranLog, errLog, trySend, tryReact, findChannelRegEx, cleanMentionID } = require("../../resources/functions");

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
        sendTheMes = emoteMessage(this.client, args.slice(comarg[0].length).trim());
        let channel;
        if (/^\d{17,19}$/.test(search)) {
          channel = msg.guild.channels.cache.get(search);
        }
        if (!channel) {
          channel = findChannelRegEx(msg, search, ["category", "voice"])[0];
          if (!channel) {
            if (this.client.owners.includes(msg.author)) {
              channel = this.client.channels.cache.get(search);
            }
            if (!channel) {
              return trySend(this.client, msg, "That channel is like your gf. Doesn't exist <:cathmmLife:772716381874946068>");
            }
          }
        }
        if (!channel.permissionsFor(msg.author).has("SEND_MESSAGES") || !channel.permissionsFor(msg.author).has("VIEW_CHANNEL")) {
          return trySend(this.client, msg, "No <:cathmmLife:772716381874946068>");
        }
        try {
          if (sendTheMes.length === 0) {
            return trySend(this.client, channel, `<@!${msg.author.id}>, If you wanna send nothin then why you even typed that <:bruhLife:798789686242967554>`);
          }
          const sendThis = {content:sendTheMes, disableMentions:"all"};
          if (msg.member?.hasPermission("MENTION_EVERYONE")) {
            sendThis.disableMentions = "none";
          }
          const send = await trySend(this.client, channel, sendThis);
          const filter = () => true,
          collector = send.createReactionCollector(filter, {time: 15*6*1000, dispose:true});
          collector.on('collect', r => {
            try {
              msg.react(r.emoji);
            } catch (e) {}
          });
          collector.on('remove', async r => await msg.reactions.resolve(r).id.remove(r.id));
          if (send) {
            tryReact(msg, 'yeLife:796401669188354090');
          }
          return send;
        } catch (e) {
          return errLog(e, msg, this.client);
        }        
    }
};