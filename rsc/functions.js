'use strict';

const { CommandInteraction, MessageEmbed } = require("discord.js");
const { randomColors } = require("../config.json");

/**
 * Command usage logger
 * @param {Message} msg
 * @param {string} addition 
 */
async function ranLog(msg, addition) {
    if (addition && typeof addition !== "string") return console.error(`[RANLOG] Not a string:`, addition);
    const channel = msg.client.channels.cache.get(ranLogger),
        ifCode = addition?.startsWith("```") && addition.endsWith("```");
    const addSplit = splitOnLength((addition?.substr(ifCode ? 2045 : 2049)).split(","), 1010, ",");
    const embed = defaultImageEmbed(msg, null, msg.command.name.toLocaleUpperCase() + ` ${msg.id}`);
    embed.setAuthor(msg.author.tag + ` (${msg.author.id})`, msg.author.displayAvatarURL({ format: "png", size: 128, dynamic: true }))
        .setURL(msg.url);
    if (addition && addition.length > 0) embed.setDescription(addition.slice(0, ifCode && addSplit[0]?.[0].length > 0 ? 2044 : 2048) + (ifCode && addSplit[0]?.[0].length > 0 ? "```" : ""));
    if (addSplit[0]?.[0].length > 0) for (const add of addSplit) embed.addField("​", "```js\n" + add.join(",") + (embed.fields.length < (addSplit.length - 1) ? ",```" : ""));
    embed.setFooter(timestampAt(msg.client), msg.guild?.iconURL({ format: "png", size: 128, dynamic: true }));
    if (msg.guild) embed.addField("Guild", `\`${msg.guild.name}\`\n(${msg.guild.id})`, true);
    embed.addField("Channel", (msg.guild ? `<#${msg.channel.id}>\n\`${msg.channel.name}\`` : `**DM**\n\`${msg.channel.recipient.tag}\``) + `\n(${msg.channel.id})`, true)
        .addField("User", `<@!${msg.author.id}>`, true);
    trySend(msg.client, channel, { embed: embed });
}

/**
 * Split on Length
 * @param {Array<String>} arr Array of words
 * @param {number} maxLength - Max character length per split
 * @param {string} joiner
 * @returns {Array<String[]>}
 */
function splitOnLength(arr, maxLength, joiner = "\n") {
    let toField = [], i = 0, pushed = 0;
    for (const res of arr) {
        if (
            arr[pushed] &&
            (
                (
                    toField[i] ?
                        toField[i].join(joiner) :
                        ""
                ) +
                joiner +
                arr[pushed]
            ).length > maxLength
        ) i++; else pushed++;

        if (!toField[i] || toField[i].length === 0)
            toField[i] = [];

        toField[i].push(res);

        if (!arr[pushed]) break;
    }
    return toField;
}

function footerColorEmbed(member) {
    const footerQuote = (member.guild.DB || member.user.DB).defaultEmbed?.footerQuote || "";
    const emb = new MessageEmbed()
        .setColor(member ? getColor(member.displayColor) : randomColors[Math.floor(Math.random() * randomColors.length)])
        .setFooter(footerQuote);
    return emb;
}

/**
 * Send message
 * @param {Client} client - (this.client)
 * @param {Message | String | TextChannel | DMChannel} msgOrChannel Message object | channel_ID
 * @param {MessageOptions} content - ({content:content,optionblabla})
 * @param {boolean} checkAd - Check source for Discord invite link (true)
 * @returns {Promise<Message>} Sent message object
 */
async function trySend(client, msgOrChannel, content, checkAd = true) {
    /*if (content instanceof MessageEmbed) {
      let fLength = [];
      for (const f of content.fields) fLength.push(f.value.length);
      console.log("Embed", content.title, timestampAt(client), "\n", content.description, content.description?.length, "\n", content.fields, fLength)
    }*/
    if (!client || !msgOrChannel || !content) return;
    if (typeof msgOrChannel === "string") msgOrChannel = client.channels.cache.get(msgOrChannel);
    if (!client.user.typingIn(msgOrChannel.channel || msgOrChannel))
        (msgOrChannel.channel || msgOrChannel).startTyping();
    if (client.owners.includes(msgOrChannel.author)) {
        checkAd = false;
        if (content.disableMentions) content.disableMentions = "none";
    }
    if (checkAd) {
        if (content.content) {
            content.content = adCheck(content.content);
        } else {
            if (typeof content === "string") content = adCheck(content);
        }
    }
    if (!((msgOrChannel instanceof Message) || (msgOrChannel instanceof TextChannel) || (msgOrChannel instanceof DMChannel))) return errLog(e, null, client, false, "[TRYSEND] Invalid {msgOrChannel} type.```js\n" + JSON.stringify(msgOrChannel, (k, v) => v || undefined, 2) + "```");
    let ret = await (msgOrChannel.channel || msgOrChannel).send(content).catch(/*msgOrChannel.channel ? noPerm(msgOrChannel) :*/ e => errLog(e, msgOrChannel, client));
    if (ret?.[0] instanceof Message) {
        // console.log(ret, typeof ret);
        ret = ret[0];
    }
    await (msgOrChannel.channel || msgOrChannel).stopTyping();
    setTimeout(async () => {
        if (client.user.typingIn(msgOrChannel.channel || msgOrChannel)) {
            await (msgOrChannel.channel || msgOrChannel).stopTyping();
        }
    }, 2000);
    setTimeout(async () => {
        if (client.user.typingIn(msgOrChannel.channel || msgOrChannel))
            await (msgOrChannel.channel || msgOrChannel).stopTyping();
    }, 5000);
    return ret;
}

/**
 * Check message's str for ads
 * @param {string} str - String to check
 */
function adCheck(str) {
    if (str.length > 8) {
        if (/(https:\/\/)?(www\.)?discord\.gg\/(?:\w{2,15}(?!\w)(?= *))/.test(str)) str = str
            .replace(/(https:\/\/)?(www\.)?discord\.gg\/(?:\w{2,15}(?!\w)(?= *))/g, '`Some invite link goes here`');
    }
    return str;
}