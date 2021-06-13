'use strict';

const { MessageEmbed, Message, GuildMember, User, Client, GuildChannel, Role, MessageOptions, TextChannel, DMChannel, Guild, Channel } = require('discord.js');
const { defaultErrorLogChannel, ranLogger } = require("../config.json");
const { database } = require("../database/mongo");
const { timestampAt } = require('./debug');
const getColor = require('./getColor');
const { randomColors } = require("../config.json");
const { CommandoMessage, CommandoClient } = require('@iceprod/discord.js-commando');

/**
 * Log an error. Second or third argument is required
 * @param {Error} theError - Catched error (error)
 * @param {CommandoMessage} msg - Message object (msg)
 * @param {Client} client - This client (this.client)
 * @param {Boolean} sendTheError - Add error content to notify message (true | false)
 * @param {String} errorMessage - Error message ("You don't have enough permission to use that command!")
 * @param {Boolean} notify - Send error to user who ran the command
 */
async function errLog(theError, msg, client, sendTheError, errorMessage, notify) {
  if (!(theError instanceof Error) || !(msg ?? client)) return console.error("[ERRLOG] Not error instance or no required param.\n", theError);
  let [logThis, inLogChannel, sendErr] = ['', '', ''];
  if (msg) {
    logThis = `\`${msg.command?.name}\` (${msg.id}) ${msg.url} in ${msg.guild ? `**${msg.channel.name}** (${msg.channel.id}) of **${msg.guild.name}** (${msg.guild.id})` : `**DM**`} ran by **${msg.author.tag}** (${msg.author.id}) \n\n`;
    if (errorMessage) {
      if (errorMessage.length > 0) {
        sendErr = sendErr + errorMessage+'\n';
        inLogChannel = errorMessage+'\n';
      }
    }
    if (sendTheError) {
      sendErr = sendErr+'```js\n'+theError.stack+'```';
    }
    if (notify || !client) {
      msg.channel.send(sendErr.trim(),{split:true}).catch(noPerm(msg));
    }
  }
  if (client) {
    try {
      inLogChannel = inLogChannel+'```js\n'+theError.stack+'```';
      const sendAt = client.channels.cache.get(defaultErrorLogChannel);
      sendAt.send(logThis + inLogChannel.trim() + timestampAt(client),{split:{maxLength:4000,char: "\n",append:'```',prepend:'```js\n'}});
    } catch (errmes) {
      console.error(errmes);
    }
  }
}

/**
 * Get message object from the message channel or provided channel
 * @param {Message} msg - Message object (msg)
 * @param {String} MainID - Message ID | Channel ID | Channel Mention
 * @param {String} SecondID - Message ID
 * @returns {Promise<Message>} Message object | undefined
 */
async function getChannelMessage(msg, MainID, SecondID) {
  if (!MainID || !msg) {
    return;
  }
  if (/\//.test(MainID)) {
    const splitURL = MainID.split(/\/+/);
    SecondID = splitURL[splitURL.length-1];
    MainID = splitURL[splitURL.length-2];
  }
  MainID = cleanMentionID(MainID);
  if (SecondID && !/\D/.test(SecondID)) {
    try {
      const meschannel = msg.client.channels.cache.get(MainID);
      return meschannel.messages.fetch(SecondID);
    } catch (theError) {
      return
    }
  } else {
    return msg.channel.messages.fetch(MainID).catch(() => {});
  }
}

function execCB(error, stdout, stderr) {
  if (error) {
    console.error(error);
    return errLog(error);
  }
  console.log('stdout:\n'+stdout);
  console.log('stderr:\n'+stderr);
}

/**
 * Command usage logger
 * @param {CommandoMessage} msg 
 * @param {String} addition 
 */
async function ranLog(msg, addition) {
  const channel = msg.client.channels.cache.get(ranLogger),
  ifCode = addition.startsWith("```") && addition.endsWith("```");
  const addSplit = splitOnLength((addition.substr(ifCode ? 2045 : 2049)).split(","), 1010, ",");
  const embed = await defaultImageEmbed(msg, null, msg.command.name.toLocaleUpperCase() + ` (${msg.id})`);
  embed.setAuthor(msg.author.tag + ` (${msg.author.id})`, msg.author.displayAvatarURL({format: "png", size: 4096, dynamic: true}))
  .setURL(msg.url)
  .setDescription(addition.slice(0, ifCode && addSplit[0]?.[0].length > 0 ? 2044 : 2048) + (ifCode && addSplit[0]?.[0].length > 0 ? "```" : ""));
  if (addSplit[0]?.[0].length > 0) for (const add of addSplit) embed.addField("​", "```js\n" + add.join(",") + (embed.fields.length < (addSplit.length - 1) ? ",```" : ""));
  embed.setFooter(timestampAt(msg.client), msg.guild?.iconURL({"size": 4096, "dynamic": true}));
  if (msg.guild) embed.addField("Guild", `\`${msg.guild?.name}\`\n(${msg.guild?.id})`, true);
  embed.addField("Channel", (msg.guild ? `<#${msg.channel.id}>\n\`${msg.channel?.name}\`` : `**DM**\n\`${msg.channel.recipient.tag}\``) + `\n(${msg.channel.id})`, true)
  .addField("User", `<@!${msg.author.id}>`, true);
  trySend(msg.client, channel, {embed: embed});
}

/**
 * Notify when more than one member found when looking in the member list
 * @param {Message} msg - Message object
 * @param {GuildMember[]} arr - Test array
 * @param {String} key - Keyword
 * @param {Number} max - Max length
 * @param {Boolean} withID - Include user_ID
 * @returns {String}
 */
function multipleMembersFound(msg, arr, key, max = 4, withID) {
  if (msg && arr.length > 0) {
    try {
      let multipleFound = [];
      for(const one of arr) {
        const user = one.user ?? one;
        let mes = user.tag;
        if (withID) {
          mes = mes + ` (${user.id})`;
        }
        multipleFound.push(mes);
      }
      let multi = [];
      for(const mu of multipleFound) {
        if (multipleFound.indexOf(mu) < max) {
          multi.push(mu);
        }
      }
      let mes = multi.join(",\n' ");
      if (multipleFound.length > max) {
        mes = mes+`,\n' ${multipleFound.length - max} more...`;
      }
      return `Multiple members found for: **${key}**\`\`\`js\n' ${mes}\`\`\``;
    } catch (e) {
      errLog(e, msg, msg.client);
    }
  } else {
    return '';
  }
}

/**
 * Get member object with RegExp
 * @param {Message | GuildMember} msg Object of the guild being searched
 * @param {String} name Keyword
 * @returns {GuildMember[]} Member object found
 */
function findMemberRegEx(msg, name) {
  if (!(msg ?? name)) {
    return;
  }
  const re = new RegExp(name, "i");
  return msg.guild?.members.cache.array().filter(r => re.test(r.displayName) || re.test(r.user.tag));
}

/**
 * React when it try something but fail because has not enough perms
 * @param {Message} msg 
 */
function noPerm(msg) {
  if (!msg) {
    return;
  }
  msg.react("sadduLife:797107817001386025").catch(() => {});
}

/**
 * Send message
 * @param {CommandoClient} client - (this.client)
 * @param {Message | String | TextChannel | DMChannel} msgOrChannel Message object | channel_ID
 * @param {MessageOptions} content - ({content:content,optionblabla})
 * @param {Boolean} adCheck - Check source for Discord invite link (true)
 * @returns {Promise<Message>} Sent message object
 */
async function trySend(client, msgOrChannel, content, adCheck = true) {
  /*if (content instanceof MessageEmbed) {
    let fLength = [];
    for (const f of content.fields) {
      fLength.push(f.value.length);
    }
    console.log("Embed", content.title, timestampAt(client), "\n", content.description, content.description?.length, "\n", content.fields, fLength)
  }*/
  if (!client || !msgOrChannel) {
    return;
  }
  if (typeof msgOrChannel === "string") {
    msgOrChannel = client.channels.cache.get(msgOrChannel);
  };
  msgOrChannel.channel?.startTyping() || msgOrChannel.startTyping();
  if (client.owners.includes(msgOrChannel.author)) {
    adCheck = false;
    if (content.disableMentions) {
      content.disableMentions = "none";
    }
  }
  if (adCheck) {
    if (content.content) {
      content.content = sentAdCheck(content.content);
    } else {
      if (typeof content === "string") {
        content = sentAdCheck(content);
      }
    }
  }
  if (msgOrChannel instanceof Message) {
    const ret = await msgOrChannel.channel.send(content).catch(() => {
      noPerm(msgOrChannel);
      msgOrChannel.channel.stopTyping();
    });
    msgOrChannel.channel.stopTyping();
    return ret;
  } else {
    if ((msgOrChannel instanceof TextChannel) || (msgOrChannel instanceof DMChannel)) {
      const ret = await msgOrChannel.send(content).catch((e) => {
        errLog(e, null, client);
        msgOrChannel.stopTyping();
      });
      msgOrChannel.stopTyping();
      return ret;
    } else {
      errLog(e, null, client, false, "[TRYSEND] Invalid {msgOrChannel} type.```js\n" + JSON.stringify(msgOrChannel, (k, v) => v ?? undefined, 2) + "```");
    }
  }
}

/**
 * Delete message
 * @param {Message} msg - Message to delete (msg)
 */
function tryDelete(msg) {
  if (!msg) {
    return;
  }
  msg.delete().catch(e => {throw e});
}

 /**
  * React message
  * @param {Message} msg - Message to react (msg)
  * @param {String} reaction - Emote ("name:ID")
  */
function tryReact(msg, reaction) {
  if (!msg || reaction.length === 0) {
    return;
  }
  msg.react(reaction).catch(e => {throw e});
}

/**
 * Check message's content for ads
 * @param {String} content - Content to check
 */
function sentAdCheck(content) {
  if (content.length > 5) {
    if (/(https:\/\/)?(www\.)?discord\.gg\/(?:\w{2,15}(?!\w)(?= *))/.test(content)) {
      content = content.replace(/(https:\/\/)?(www\.)?discord\.gg\/(?:\w{2,15}(?!\w)(?= *))/, '`Some invite link goes here`');
    }
  }
  return content;
}

/**
 * Make default image embed
 * @param {Message | GuildMember} msg 
 * @param {String} image 
 * @param {GuildMember | User} author 
 * @param {String} title 
 * @param {String} footerQuote
 * @returns {Promise<MessageEmbed>}
 */
async function defaultImageEmbed(msg, image, title, footerQuote) {
  if (!footerQuote) {
    const r = await database.collection(msg.guild ? "Guild" : "User").findOne({document: msg.guild?.id ?? msg.author?.id}).catch(() => {});
    footerQuote = r?.["settings"]?.defaultEmbed?.footerQuote || "";
  }
  return new MessageEmbed()
  .setTitle(title)
  .setImage(image)
  .setColor(msg.guild ? getColor(msg.member?.displayColor) : randomColors[Math.floor(Math.random() * randomColors.length)])
  .setFooter(footerQuote);
}

/**
 * Return clean ID of provided key
 * @param {String} key - Mention | Channel Name | Username | Rolename
 * @returns {String} Clean ID
 */
function cleanMentionID(key) {
  if (!key) {
    return;
  }
  let uID = key.trim();
  if (!/\D/.test(uID)) {
    return uID;
  }
  if (uID.startsWith('<@') || uID.startsWith('<#')) {
    uID = uID.slice(2);
  }
  if (uID.endsWith('>')) {
    uID = uID.slice(0,-1)
  }
  if (uID.startsWith('!') || uID.startsWith("@") || uID.startsWith("#") || uID.startsWith('&')) {
    uID = uID.slice(1);
  }
  return uID;
}

/**
 * Get channel object wit RegExp
 * @param {Message | GuildMember} msg Object of the guild being searched
 * @param {String} name Keyword
 * @param {ChannelType[]} exclude Exclude channel type
 * @returns {GuildChannel[]} Channels object found
 */
function findChannelRegEx(msg, name, exclude) {
  const re = new RegExp(name, "i");
  return msg.guild?.channels.cache.array().filter(r => {
    if (exclude?.includes(r.type)) {
      return false;
    } else {
      return re.test(r.name);
    }
  });
}

/**
 * Get role object with RegExp
 * @param {Message | GuildMember} msg Object of the guild being searched
 * @param {String} name Keyword
 * @returns {Role[]} Roles object found
 */
function findRoleRegEx(msg, name) {
  const re = new RegExp(name, "i");
  return msg.guild?.roles.cache.array().filter(r => re.test(r.name));
}

/**
 * Notify when more than one channel found when looking in the channel list
 * @param {Message} msg - Message object
 * @param {GuildChannel[]} arr - Test array
 * @param {String} key - Keyword
 * @param {Number} max - Max length
 * @param {Boolean} withID - Include channel_ID
 * @returns {String}
 */
function multipleChannelsFound(msg, arr, key, max = 4, withID) {
  if (arr.length > 0) {
    try {
      let multipleFound = [];
      for(const one of arr) {
        let mes = one.name;
        if (withID) {
          mes = mes + ` (${one.id})`;
        }
        multipleFound.push(mes);
      }
      let multi = [];
      for(const mu of multipleFound) {
        if (multipleFound.indexOf(mu) < max) {
          multi.push(mu);
        }
      }
      let mes = multi.join(",\n' ");
      if (multipleFound.length > max) {
        mes = mes+`,\n' ${multipleFound.length - max} more...`;
      }
      return `Multiple channels found for: **${key}**\`\`\`js\n' ${mes}\`\`\``;
    } catch (e) {
      errLog(e, msg, msg.client);
    }
  } else {
    return '';
  }
}

/**
 * Notify when more than one role found when looking in the role list
 * @param {Message} msg - Message object
 * @param {Role[]} arr - Test array
 * @param {String} key - Keyword
 * @param {Number} max - Max length
 * @param {Boolean} withID - Include role_ID
 * @returns {String}
 */
 function multipleRolesFound(msg, arr, key, max = 4, withID) {
  if (arr.length > 0) {
    try {
      let multipleFound = [];
      for(const one of arr) {
        let mes = one.name;
        if (withID) {
          mes = mes + ` (${one.id})`;
        }
        multipleFound.push(mes);
      }
      let multi = [];
      for(const mu of multipleFound) {
        if (multipleFound.indexOf(mu) < max) {
          multi.push(mu);
        }
      }
      let mes = multi.join(",\n' ");
      if (multipleFound.length > max) {
        mes = mes+`,\n' ${multipleFound.length - max} more...`;
      }
      return `Multiple roles found for: **${key}**\`\`\`js\n' ${mes}\`\`\``;
    } catch (e) {
      errLog(e, msg, msg.client);
    }
  } else {
    return '';
  }
}

/**
 * Standard
 * @param {Message} msg - Message object
 * @param {String} key - Channel ID | Mention | Name
 * @returns {GuildChannel | Channel} Channel object
 */
function getChannelProchedure(msg, key) {
  if (key.length === 0) {
    return;
  }
  const search = cleanMentionID(key);
  if (search.length === 0) {
    return;
  }
  let channel;
  if (/^\d{17,19}$/.test(search)) {
    channel = msg.guild?.channels.cache.get(search);
    if (!channel && msg.client.owners.includes(msg.author)) {
      channel = msg.client.channels.cache.get(search);
    }
  }
  if (!channel) {
    channel = findChannelRegEx(msg, search, ["category", "voice"])?.[0];
  }
  return channel;
}
/**
 * Compare 2 different timestamp
 * @param {Number} compare - Number to compare
 * @returns {Number} Result
 */
function getUTCComparison(compare) {
  return compare - new Date().valueOf();
}
/**
 * Make guild's event log embed with author and footer
 * @param {Guild} guild 
 * @returns {MessageEmbed}
 */
function defaultEventLogEmbed(guild) {
  return new MessageEmbed()
  .setAuthor(guild.name, guild.iconURL({size:4096, dynamic: true}))
  .setFooter((guild.defaultEmbed?.footerQuote ? guild.defaultEmbed.footerQuote + "・" : "") + new Date(new Date().valueOf() + (guild.client.matchTimestamp ?? 0)).toUTCString().slice(0, -4));
}

/**
 * Split on Length
 * @param {Array<String>} arr
 * @param {Number} maxLength - Max character length per split
 * @param {String} joiner
 * @returns {Array<String[]>}
 */
function splitOnLength(arr, maxLength, joiner = "\n") {
  let toField = [], i = 0, pushed = 0;
  for (const res of arr) {
    if (arr[pushed] && ((toField[i] ? toField[i].join(joiner) : "") + joiner + arr[pushed]).length > maxLength) {
      i++;
    } else {
      pushed++;
    }
    if (!toField[i] || toField[i].length === 0) {
      toField[i] = [];
    }
    toField[i].push(res);
    if (!arr[pushed]) {
      break;
    }
  }
  return toField;
}

module.exports = {
  cleanMentionID, defaultEventLogEmbed,
  multipleMembersFound, multipleRolesFound, multipleChannelsFound,
  findMemberRegEx, findChannelRegEx, findRoleRegEx,
  getChannelMessage, errLog,
  execCB, ranLog, noPerm, getUTCComparison,
  trySend, tryDelete, tryReact,
  sentAdCheck, defaultImageEmbed, getChannelProchedure,
  splitOnLength
}