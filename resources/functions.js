'use strict';

const { MessageEmbed, Message, GuildMember, User, GuildChannel, Role, MessageOptions, TextChannel, DMChannel, Guild, Channel } = require('discord.js');
const { errLogChannel, ranLogger } = require("../config.json");
const { timestampAt } = require('./debug');
const getColor = require('./getColor');
const { randomColors } = require("../config.json");
const { CommandoMessage, CommandoClient } = require('@iceprod/discord.js-commando');
const { DateTime } = require('luxon');

/**
 * Log an error. Second or third argument is required
 * @param {Error} theError - Catched error (error)
 * @param {CommandoMessage} msg - Message object (msg)
 * @param {CommandoClient} client - This client (this.client)
 * @param {boolean} sendTheError - Add error content to notify message (true | false)
 * @param {string} errorMessage - Error message ("You don't have enough permission to use that command!")
 * @param {boolean} notify - Send error to user who ran the command
 */
async function errLog(theError, msg, client, sendTheError, errorMessage, notify) {
  if (!client && msg) client = msg.client;
  if (!(theError instanceof Error) || !client) return console.error("[ERRLOG] Not error instance or no required param:", theError);
  let [ret, logThis, inLogChannel, sendErr] = [undefined, '', '', ''];
  if (msg instanceof Message) {
    // client.emit("commandError", msg.command, theError, msg);
    logThis = `\`${msg.command?.name}\` (${msg.id}) ${msg.url} in ${msg.guild ? `**${msg.channel.name}**` +
      ` (${msg.channel.id}) of **${msg.guild.name}** (${msg.guild.id})` : `**DM**`} ran by **${msg.author.tag}** (${msg.author.id}) \n\n`;
    if (errorMessage) {
      if (errorMessage.length > 0) {
        sendErr = sendErr + errorMessage + '\n';
        inLogChannel = errorMessage + '\n';
      }
    }
    if (sendTheError) sendErr = sendErr + '```js\n' + theError.stack + '```';
    if (notify) ret = await msg.channel.send(sendErr.trim(), {
      split: {
        maxLength: 2000, char: "\n",
        append: '```', prepend: '```js\n'
      }
    }).catch(noPerm(msg).sfskdufsdgsd);
  }
  if (client) {
    inLogChannel = inLogChannel + '```js\n' + theError.stack + '```';
    try {
      const sendAt = client.channels.cache.get(errLogChannel);
      sendAt.send(logThis + inLogChannel.trim() + timestampAt(client), {
        split: {
          maxLength: 2000, char: "\n",
          append: '```', prepend: '```js\n'
        }
      });
    } catch {
      return console.error("Can't log to error channel or not configured.", timestampAt() + ":", theError);
    }
  }
  return ret;
}

/**
 * Get message object from the message channel or provided channel
 * @param {Message} msg - Message object (msg)
 * @param {string} MainID - Message ID | Channel_[mention|ID] | Message link
 * @param {string} SecondID - Message ID
 * @returns {Promise<Message>} Message object | undefined
 */
async function getChannelMessage(msg, MainID, SecondID) {
  if (!MainID || !msg) return;
  if (/\//.test(MainID)) {
    const splitURL = MainID.split(/\/+/);
    SecondID = splitURL[splitURL.length - 1];
    MainID = splitURL[splitURL.length - 2];
  }
  MainID = cleanMentionID(MainID);
  if (SecondID && !/\D/.test(SecondID)) {
    try {
      const meschannel = (msg.client.owners.includes(msg.author) ? msg.client : msg.guild).channels.cache.get(MainID);
      return meschannel.messages.fetch(SecondID, true).catch(() => { });
    } catch {
      return;
    }
  } else {
    return msg.channel.messages.fetch(MainID, true).catch(() => { });
  }
}

function execCB(error, stdout, stderr) {
  if (error) {
    return errLog(error);
  }
  console.log('stdout:\n' + stdout);
  console.log('stderr:\n' + stderr);
}

/**
 * Command usage logger
 * @param {CommandoMessage} msg
 * @param {string} addition 
 */
async function ranLog(msg, addition) {
  if (typeof addition !== "string") return console.error(`[RANLOG] Not a string:`, addition);
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
 * Notify when more than one member found when looking in the member list
 * @param {Message} msg - Message object
 * @param {GuildMember[]} arr - Test array
 * @param {string} key - Keyword
 * @param {number} max - Max length
 * @param {boolean} withID - Include user_ID
 * @param {string} withNick
 * @returns {string}
 */
function multipleMembersFound(msg, arr, key, max = 4, withID, withNick) {
  if (msg && arr.length > 1) {
    try {
      let multipleFound = [];
      for (const one of arr) {
        const user = one.user || one;
        let mes = user.tag;
        if (withNick) mes += ` (${one.displayName})`
        if (withID) mes += ` (${user.id})`;
        multipleFound.push(mes);
      }
      let multi = [];
      for (const mu of multipleFound) if (multipleFound.indexOf(mu) < max) multi.push(mu);
      let mes = multi.join(",\n' ");
      if (multipleFound.length > max) mes = mes + `,\n' ${multipleFound.length - max} more...`;
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
 * @param {Message | GuildMember | Guild} base Object of the guild being searched
 * @param {string} key Keyword
 * @returns {GuildMember[]} Member object found
 */
function findMemberRegEx(base, key) {
  if (!base || !key) return;
  const re = new RegExp(key, "i");
  return (base.guild || base).members.cache.filter(r => re.test(r.displayName) || re.test(r.user.tag)).map(r => r);
}

/**
 * React when it try something but fail because has not enough perms
 * @param {Message} msg 
 */
async function noPerm(msg) {
  if (!msg) return;
  try {
    return msg.react("sadduLife:797107817001386025");
  } catch { }
}

/**
 * Send message
 * @param {CommandoClient} client - (this.client)
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
  setTimeout(() => {
    if (client.user.typingIn(msgOrChannel.channel || msgOrChannel)) {
      (msgOrChannel.channel || msgOrChannel).stopTyping();
    }
  }, 2000);
  setTimeout(() => {
    if (client.user.typingIn(msgOrChannel.channel || msgOrChannel))
      (msgOrChannel.channel || msgOrChannel).stopTyping();
  }, 5000);
  return ret;
}

/**
 * Delete message
 * @param {Message} msg - Message to delete (msg)
 */
async function tryDelete(msg) {
  if (!msg) return;
  try {
    return msg.delete();
  } catch (e) {
    throw e;
  }
}

/**
 * React message
 * @param {Message} msg - Message to react (msg)
 * @param {string} reaction - Emote ("name:ID")
 */
async function tryReact(msg, reaction) {
  if (!msg || !reaction || reaction.length === 0) return;
  try {
    return msg.react(reaction);
  } catch (e) {
    throw e;
  }
}

/**
 * Check message's content for ads
 * @param {string} content - Content to check
 */
function adCheck(content) {
  if (content.length > 5) {
    if (/(https:\/\/)?(www\.)?discord\.gg\/(?:\w{2,15}(?!\w)(?= *))/.test(content)) content = content
      .replace(/(https:\/\/)?(www\.)?discord\.gg\/(?:\w{2,15}(?!\w)(?= *))/g, '`Some invite link goes here`');
  }
  return content;
}

/**
 * Make default image embed
 * @param {Message | GuildMember} msg 
 * @param {string} image 
 * @param {GuildMember | User} author 
 * @param {string} title 
 * @param {string} footerQuote
 * @returns {MessageEmbed}
 */
function defaultImageEmbed(msg, image, title, footerQuote) {
  if (!footerQuote) footerQuote = (msg.guild?.DB || msg.author.DB).defaultEmbed?.footerQuote || "";
  const emb = new MessageEmbed()
    .setImage(image)
    .setColor(msg.guild ? getColor((msg.member || msg).displayColor) : randomColors[Math.floor(Math.random() * randomColors.length)])
    .setFooter(footerQuote);
  if (title) emb.setTitle(title);
  return emb;
}

/**
 * Return clean ID of provided key
 * @param {string} key - Mention | Channel Name | Username | Rolename
 * @returns {string} Clean ID
 */
function cleanMentionID(key) {
  if (!key || (typeof key !== "string")) return;
  let uID = key.trim();
  if (!/\D/.test(uID)) return uID;
  if (uID.startsWith('<@') || uID.startsWith('<#')) uID = uID.slice(2);
  if (uID.endsWith('>')) uID = uID.slice(0, -1);
  if (uID.startsWith('!') || uID.startsWith("@") || uID.startsWith("#") || uID.startsWith('&')) uID = uID.slice(1);
  return uID;
}

/**
 * Get channel object wit RegExp
 * @param {Message | GuildMember | Guild} msg Object of the guild being searched
 * @param {string} name Keyword
 * @param {["text"|"dm"|"voice"|"group"|"category"|"news"|"store"|"unknown"]} exclude Exclude channel type
 * @returns {GuildChannel[]} Channels object found
 */
function findChannelRegEx(msg, name, exclude) {
  if (!msg || !name) return;
  const re = new RegExp(name, "i");
  return (msg.guild || msg).channels.cache.filter(r => {
    if (exclude?.includes(r.type)) {
      return false;
    } else {
      return re.test(r.name);
    }
  }).map(r => r);
}

/**
 * Get role object with RegExp
 * @param {Message | GuildMember | Guild} msg Object of the guild being searched
 * @param {string} name Keyword
 * @returns {Role[]} Roles object found
 */
function findRoleRegEx(msg, name) {
  if (!msg || !name) return;
  const re = new RegExp(name, "i");
  return (msg.guild || msg).roles.cache.filter(r => re.test(r.name)).map(r => r);
}

/**
 * Notify when more than one channel found when looking in the channel list
 * @param {Message} msg - Message object
 * @param {GuildChannel[]} arr - Test array
 * @param {string} key - Keyword
 * @param {number} max - Max length
 * @param {boolean} withID - Include channel_ID
 * @returns {string}
 */
function multipleChannelsFound(msg, arr, key, max = 4, withID) {
  if (msg && arr.length > 1) {
    try {
      let multipleFound = [];
      for (const one of arr) {
        let mes = one.name;
        if (withID) mes = mes + ` (${one.id})`;
        multipleFound.push(mes);
      }
      let multi = [];
      for (const mu of multipleFound) if (multipleFound.indexOf(mu) < max) multi.push(mu);
      let mes = multi.join(",\n' ");
      if (multipleFound.length > max) mes = mes + `,\n' ${multipleFound.length - max} more...`;
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
 * @param {string} key - Keyword
 * @param {number} max - Max length
 * @param {boolean} withID - Include role_ID
 * @returns {string}
 */
function multipleRolesFound(msg, arr, key, max = 4, withID) {
  if (msg && arr.length > 1) {
    try {
      let multipleFound = [];
      for (const one of arr) {
        let mes = one.name;
        if (withID) mes = mes + ` (${one.id})`;
        multipleFound.push(mes);
      }
      let multi = [];
      for (const mu of multipleFound) if (multipleFound.indexOf(mu) < max) multi.push(mu);
      let mes = multi.join(",\n' ");
      if (multipleFound.length > max) mes = mes + `,\n' ${multipleFound.length - max} more...`;
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
 * @param {Message | Guild} msg - Message object
 * @param {string} key - Channel ID | Mention | Name
 * @param {["text"|"voice"|"category"|"news"|"store"|"unknown"]} exclude - Exclude channel type
 * @returns {GuildChannel | Channel} Channel object
 */
function getChannel(msg, key, exclude) {
  if (!key || key.length === 0 || !msg) return;
  const search = cleanMentionID(key);
  if (search.length === 0) return;
  if ((msg instanceof Message) && search === "here") return msg.channel;
  let channel;
  if (/^\d{17,19}$/.test(search)) {
    channel = (msg.guild || msg).channels.cache.get(search);
    if (!channel && msg.client.owners.includes(msg.author)) channel = msg.client.channels.cache.get(search);
  }
  if (!channel) channel = findChannelRegEx(msg, search, exclude)?.[0];
  return channel;
}

/**
 * Get guild member using name || tag || ID
 * @param {Guild} guild 
 * @param {string} key - name || tag || ID
 * @returns {GuildMember[]}
 */
function getMember(guild, key) {
  if (!(guild || key)) return;
  const use = cleanMentionID(key);
  if (!use || use.length === 0) return;
  let found = [];
  if (/^\d{17,19}$/.test(use)) {
    found.push(guild.member(use));
  } else {
    found = findMemberRegEx(guild, use);
  }
  return found;
}

/**
 * Compare 2 different timestamp
 * @param {number} compare - Number to compare
 * @returns {number} Result
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
  if (!guild) return;
  const C = guild.member(guild.client.user);
  return new MessageEmbed()
    .setColor(getColor(C.displayColor))
    .setAuthor(guild.name)
    .setFooter((guild.DB?.defaultEmbed?.footerQuote ?
      guild.DB.defaultEmbed.footerQuote : "​"), guild.iconURL({ format: "png", size: 128, dynamic: true }))
    .setTimestamp(new Date());
}

/**
 * Split on Length
 * @param {Array<String>} arr
 * @param {number} maxLength - Max character length per split
 * @param {string} joiner
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
    if (!toField[i] || toField[i].length === 0) toField[i] = [];
    toField[i].push(res);
    if (!arr[pushed]) break;
  }
  return toField;
}

/**
 * Parse string (split ",")
 * @param {string} content
 * @returns {String[]}
 */
function parseComa(content) {
  if (!content) return;
  return content.split(/(?<!\\),+(?!\d*})/);
}

/**
 * Parse string (split "--")
 * @param {string} content
 * @returns {String[]}
 */
function parseDoubleDash(content) {
  if (!content) return;
  return content.split(/(?<!https?:\/\/[^\s\n]+)(?<!\\)(--)+/);
}

/**
 * Parse string (split "-")
 * @param {string} content
 * @returns {String[]}
 */
function parseDash(content) {
  if (!content) return;
  return content.split(/(?<!https?:\/\/[^\s\n]+)(?<!\\)-(?!-)/);
}

const reValidURL = /^https?:\/\/[^\s\n]+\.[^\s\n][^\s\n]/;

/**
 * Get user
 * @param {Message} msg 
 * @param {string} key 
 * @param {any} inGuild
 * @returns {User}
 */
async function getUser(msg, key, inGuild) {
  if (!(msg || key)) return;
  const use = cleanMentionID(key);
  if (!use || use.length === 0) return;
  if (/^\d{17,19}$/.test(use)) {
    const ret = msg.client.users.cache.get(use);
    if (ret) return ret; else return msg.client.users.fetch(use);
  } else if (inGuild) return getMember(msg.guild, use)[0]?.user;
}

/**
 * @param {Guild} guild 
 * @param {string} key 
 * @returns {Role}
 */
function getRole(guild, key) {
  if (!(guild || key)) return;
  const use = cleanMentionID(key);
  if (!use || use.length === 0) return;
  if (/^\d{17,19}$/.test(use)) return guild.roles.cache.get(use); else return findRoleRegEx(guild, use)?.[0];
}

function wait(ms) { return new Promise(r => setTimeout(() => r(), ms)) }

/**
 * @param {Date|DateTime|number|string} date - Number | String must be in miliseconds
 * @returns {string} - Discord format ready to use
 */
function defaultDateFormat(date) {
  let use;
  if ((date instanceof Date) || date instanceof DateTime) use = date.valueOf();
  else if (typeof date === "string") use = parseInt(date, 10);
  else use = date;
  return "<t:" + (Math.floor(use / 1000)) + ":F>";
}

const defaultSplitMessage = { maxLength: 2000, char: "", append: '```', prepend: '```js\n' };

/**
 * @param {object} oldObj 
 * @param {object} newObj 
 */
function changed(oldObj, newObj) {
  let diffOld = {}, diffNew = {};
  for (const key in oldObj) {
    if (oldObj[key] === newObj[key]) continue;
    diffOld[key] = oldObj[key];
  };
  for (const key in newObj) {
    if (newObj[key] === oldObj[key]) continue;
    diffNew[key] = newObj[key];
  };
  return { oldObj: diffOld, newObj: diffNew };
}

/**
 * @param {Guild} guild Get audit from
 * @param {Date} dateNow 
 * @param {string} id Target ID
 * @param {import("discord.js").GuildAuditLogsFetchOptions} option 
 * @returns {Promise<GuildAuditLogsEntry>}
 */
async function getAudit(guild, dateNow, id, option, filter = (value, key, collection) =>
  value.target.id === id && (dateNow.valueOf() - value.createdTimestamp) < 60000) {
  const col = await guild.fetchAuditLogs(option);
  const fil = col.entries.filter(filter);
  return fil.first();
};

module.exports = {
  cleanMentionID, defaultEventLogEmbed,
  multipleMembersFound, multipleRolesFound, multipleChannelsFound,
  findMemberRegEx, findChannelRegEx, findRoleRegEx,
  getChannelMessage, errLog, changed, getAudit,
  execCB, ranLog, noPerm, getUTCComparison,
  trySend, tryDelete, tryReact, defaultDateFormat,
  adCheck, defaultImageEmbed, getChannel,
  splitOnLength, parseComa, parseDoubleDash, getMember,
  parseDash, reValidURL, getUser, getRole, wait, defaultSplitMessage
}