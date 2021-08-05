'use strict';
const commando = require("@iceprod/discord.js-commando");
const emoteMessage = require("../../resources/emoteMessage");
const { ranLog, errLog, trySend, tryReact, cleanMentionID, getChannel } = require("../../resources/functions");

module.exports = class send extends commando.Command {
  constructor(client) {
    super(client, {
      name: "send",
      memberName: "send",
      group: "fun",
      description: "Send message to designated channel.",
      guildOnly: true
    });
  }
  async run(msg, args) {
    const comarg = args.trim().split(/ +/);
    if (!comarg[0]) {
      return trySend(this.client, msg, 'Where?!?');
    }
    const search = cleanMentionID(comarg[0]),
      sendTheMes = emoteMessage(this.client, args.slice(comarg[0].length).trim());
    let channel = getChannel(msg, search, ["category", "voice"]);
    if (!channel) {
      return trySend(this.client, msg, "That channel is like your gf. Doesn't exist <:yeLife:796401669188354090>");
    }
    if (!channel.permissionsFor(msg.author).has("SEND_MESSAGES") || !channel.permissionsFor(msg.author).has("VIEW_CHANNEL")) {
      return trySend(this.client, msg, "No <:yeLife:796401669188354090>");
    }
    try {
      if (sendTheMes.length === 0) {
        return trySend(this.client, channel, `<@!${msg.author.id}>, If you wanna send nothin then why you even typed that <:bruhLife:798789686242967554>`);
      }
      const sendThis = { content: sendTheMes, disableMentions: "all" };
      if (msg.member?.hasPermission("MENTION_EVERYONE")) sendThis.disableMentions = "none";
      const send = await trySend(this.client, channel, sendThis, !msg.client.owners.includes(msg.author));
      const filter = () => true,
        collector = send.createReactionCollector(filter, { time: 15 * 6 * 1000 });
      collector.on('collect', r => {
        try {
          msg.react(r.emoji);
        } catch (e) { }
      });
      collector.on('remove', async r => msg.reactions.resolve(r).remove());
      if (send) {
        ranLog(msg, send.content.slice(0, 1900) + "\n\nSent to: " + `[${send.channel.name}](${send.url}) <#${send.channel.id}> (${send.channel.id})`);
        tryReact(msg, 'yeLife:796401669188354090');
      }
      return send;
    } catch (e) {
      return errLog(e, msg, this.client);
    }
  }
};