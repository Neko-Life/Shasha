'use strict';

const { MessageEmbed, Message, GuildMember, User, Client, GuildChannel, Role, MessageOptions, Channel } = require('discord.js');
const { defaultErrorLogChannel, ranLogger } = require("../config.json");
const { database } = require("../database/mongo");
const { timestampAt } = require('./debug');
const getColor = require('./getColor');
const { randomColors } = require("../config.json");
const { CommandoMessage, CommandoClient } = require('@iceprod/discord.js-commando');

/**
 * Log an error. If second argument, third argument is required
 * @param {Error} theError - Catched error (error)
 * @param {CommandoMessage} msg - Message object (msg)
 * @param {Client} client - This client (this.client)
 * @param {Boolean} sendTheError - Add error content to notify message (true | false)
 * @param {String} errorMessage - Error message ("You don't have enough permission to use that command!")
 * @param {Boolean} notify - Send error to user who ran the command
 */
async function errLog(theError, msg, client, sendTheError, errorMessage, notify) {
  let errLogPath, [logThis, inLogChannel, sendErr] = ['', '', ''];
  if (msg) {
    logThis = `\`${msg.command.name}\` (${msg.id}) ${msg.url} in ${msg.guild ? `**${msg.channel.name}** (${msg.channel.id}) of **${msg.guild.name}** (${msg.guild.id})` : `**DM**`} ran by **${msg.author.tag}** (${msg.author.id}) \n\n`;
    msg.guild ? errLogPath = `../Guilds/${msg.guild.id}/Log/` : errLogPath = '../Log/';
    if (errorMessage) {
      if (errorMessage.length > 0) {
        sendErr = sendErr + errorMessage+'\n\n';
        inLogChannel = errorMessage+'\n';
      }
    }
    if (sendTheError) {
      sendErr = sendErr+'```js\n'+theError.stack+'```';
    }
    if (notify) {
      try {
        msg.channel.send(sendErr.trim(),{split:true});
      } catch (e) {
        errLog(e,msg);
      }
    }
  } else {
    errLogPath = '../Log/';
  }
  if (client) {
    try {
      inLogChannel = inLogChannel+'```js\n'+theError.stack+'```';
      if (msg && msg.guild && msg.guild.id === "823815890285756447") {
        logThis = "";
      }
      const sendAt = client.channels.cache.get(defaultErrorLogChannel);
      sendAt.send(logThis + inLogChannel.trim() + timestampAt(),{split:true});
    } catch (errmes) {
      errLog(errmes, msg);
    }
  }
  const f = new Date().toUTCString();
  logThis = logThis+theError.stack+"\nat: "+f;
  return //console.log(logThis);
}

/**
 * Get message object from the message channel or provided channel
 * @param {Client} client - This client (this.client)
 * @param {Message} msg - Message object (msg)
 * @param {String} MainID - Message ID | Channel ID | Channel Mention
 * @param {String} SecondID - Message ID
 * @returns {Promise<Message>} Message object | undefined
 */
async function getChannelMessage(client, msg, MainID, SecondID) {
  if (!MainID) {
    return
  }
  if (/\//.test(MainID)) {
    const splitURL = MainID.split(/\/+/);
    SecondID = splitURL[splitURL.length-1];
    MainID = splitURL[splitURL.length-2];
  }
  if (MainID.startsWith('<') && MainID.endsWith('>')) {
    MainID = MainID.slice(2, -1);
  }
  if (SecondID && (!/\D/.test(SecondID))) {
    try {
      const meschannel = client.channels.cache.get(MainID);
      return await meschannel.messages.fetch(SecondID);
    } catch (theError) {
      return
    }
  }
  return await msg.channel.messages.fetch(MainID).catch(e => {return});
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
 * @param {CommandoClient} client 
 * @param {CommandoMessage} msg 
 * @param {String} addition 
 */
async function ranLog(client, msg, addition) {
  const channel = client.channels.cache.get(ranLogger);
  const embed = await defaultImageEmbed(msg, null, msg.command.name.toLocaleUpperCase() + ` (${msg.id})`);
  embed.setAuthor(msg.author.tag + ` (${msg.author.id})`, msg.author.displayAvatarURL({"size": 4096, "dynamic": true}))
  .setURL(msg.url)
  .setDescription(addition)
  .setFooter(timestampAt(), msg.guild?.iconURL({"size": 4096, "dynamic": true}))
  .addField("Guild", `**${msg.guild?.name}** (${msg.guild?.id})`, true)
  .addField("Channel", `**${msg.channel?.name}** (${msg.channel.id})`, true)
  .addField("User", `<@!${msg.author.id}>`, true);
  trySend(client, channel, {embed: embed});
}

/**
 * Notify when more than one member found when looking in the member list
 * @param {Client} client - (this.client)
 * @param {Message} msg - Message object
 * @param {GuildMember[]} arr - Test array
 * @param {String} key - Keyword
 * @param {Number} max - Max length
 * @param {Boolean} withID - Include user_ID
 * @returns {String}
 */
function multipleMembersFound(client, msg, arr, key, max = 4, withID) {
  if (arr.length > 0) {
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
      errLog(e, msg, client);
    }
  } else {
    return '';
  }
}

/**
 * Get member object with RegExp
 * @param {Message} msg Message object of the guild being searched
 * @param {String} name Keyword
 * @returns {GuildMember[]} Member object found
 */
function findMemberRegEx(msg, name) {
  const re = new RegExp(name, "i");
  return msg.guild?.members.cache.array().filter(r => re.test(r.displayName) || re.test(r.user.tag));
}

/**
 * React when it try something but fail because has not enough perms
 * @param {Message} msg 
 */
function noPerm(msg) {
  if (msg) {
    msg.react("sadduLife:797107817001386025").catch(() => {});
  }
}

/**
 * Send message
 * @param {Client} client - (this.client)
 * @param {Message | String | Channel} msg Message object | channel_ID
 * @param {MessageOptions} content - ({content:content,optionblabla})
 * @param {Boolean} adCheck - Check source for Discord invite link (true)
 * @returns {Promise<Message>} Sent message object
 */
async function trySend(client, msg, content, adCheck = true) {
  //console.log(...content);
  let msgOf;
  if (msg?.channel) {
    msgOf = msg.channel;
  } else {
    if (typeof msg === "string") {
      msgOf = client.channels.cache.get(msg);
    } else {
      msgOf = msg;
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
  const sentMes = await msgOf.send(content)
  .catch((e) => {
    console.error(e);
    if (msg?.channel) {
      noPerm(msg);
    }
    return
  });
  return sentMes;
}

/**
 * Delete message
 * @param {Message} msg - Message to delete (msg)
 */
function tryDelete(msg) {
  if (msg) {
    msg.delete().catch(noPerm(msg));
  }
}

 /**
  * React message
  * @param {Message} msg - Message to react (msg)
  * @param {String} reaction - Emote ("name:ID")
  */
function tryReact(msg, reaction) {
  if (msg) {
      msg.react(reaction).catch(() => {});
  }
}

/**
 * Check a message sent by client for ads
 * @param {String} content - Sent message object (await msg.channel.send("discord.gg/banana"))
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
 * @param {Message} msg 
 * @param {String} image 
 * @param {GuildMember | User} author 
 * @param {String} title 
 * @param {String} footerQuote
 * @returns {Promise<MessageEmbed>}
 */
async function defaultImageEmbed(msg, image, title, footerQuote) {
  if (!footerQuote) {
    const r = await database.collection(msg.guild ? "Guild" : "User").findOne({document: msg.guild?.id ?? msg.author.id}).catch(() => {});
    footerQuote = r?.["settings"]?.defaultEmbed?.footerQuote || "";
  }
  return new MessageEmbed()
  .setTitle(title)
  .setImage(image)
  .setColor(msg.guild ? getColor(msg.member.displayColor) : randomColors[Math.floor(Math.random() * randomColors.length)])
  .setFooter(footerQuote);
}

/**
 * Return clean ID of provided key
 * @param {String} key - Mention | Channel Name | Username | Rolename
 * @returns {String} Clean ID
 */
function cleanMentionID(key) {
  let uID = key.trim();
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
 * @param {Message} msg Message object of the guild being searched
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
 * @param {Message} msg Message object of the guild being searched
 * @param {String} name Keyword
 * @returns {Role[]} Roles object found
 */
function findRoleRegEx(msg, name) {
  const re = new RegExp(name, "i");
  return msg.guild?.roles.cache.array().filter(r => re.test(r.name));
}

/**
 * Notify when more than one channel found when looking in the channel list
 * @param {Client} client - (this.client)
 * @param {Message} msg - Message object
 * @param {GuildChannel[]} arr - Test array
 * @param {String} key - Keyword
 * @param {Number} max - Max length
 * @param {Boolean} withID - Include channel_ID
 * @returns {String}
 */
function multipleChannelsFound(client, msg, arr, key, max = 4, withID) {
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
      errLog(e, msg, client);
    }
  } else {
    return '';
  }
}

/**
 * Notify when more than one role found when looking in the role list
 * @param {Client} client - (this.client)
 * @param {Message} msg - Message object
 * @param {Role[]} arr - Test array
 * @param {String} key - Keyword
 * @param {Number} max - Max length
 * @param {Boolean} withID - Include role_ID
 * @returns {String}
 */
 function multipleRolesFound(client, msg, arr, key, max = 4, withID) {
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
      errLog(e, msg, client);
    }
  } else {
    return '';
  }
}

module.exports = {
  cleanMentionID,
  multipleMembersFound, multipleRolesFound, multipleChannelsFound,
  findMemberRegEx, findChannelRegEx, findRoleRegEx,
  getChannelMessage, errLog,
  execCB, ranLog, noPerm,
  trySend, tryDelete, tryReact,
  sentAdCheck, defaultImageEmbed 
}