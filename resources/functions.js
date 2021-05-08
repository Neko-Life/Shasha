'use strict';

const fs = require('fs-extra');
const { MessageEmbed, Message, GuildMember, User, Channel, Client } = require('discord.js');
const { defaultErrorLogChannel } = require("../config.json");
const { database } = require("../database/mongo");

/**
 * Log an error. If second argument, third argument is required
 * @param {Error} theError - Catched error (error)
 * @param {Message} msg - Message object (msg)
 * @param {Client} client - This client (this.client)
 * @param {Boolean} sendTheError - Add error content to notify message (true | false)
 * @param {String} errorMessage - Error message ("You don't have enough permission to use that command!")
 * @param {Boolean} notify - Send error to user who ran the command
 */
async function errLog(theError, msg, client, sendTheError, errorMessage, notify) {
  let errLogPath, [logThis, inLogChannel, sendErr] = ['', '', ''];
  if (msg) {
    const comErr = msg.content.trim().split(/ +/)[0];
    logThis = `\`${comErr}\` (${msg.id}) ${msg.url} in ${msg.guild ? `**${msg.channel.name}** (${msg.channel.id}) of **${msg.guild.name}** (${msg.guild.id})` : `**DM**`} ran by **${msg.author.tag}** (${msg.author.id}) \n\n`;
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
      const sendAt = await client.channels.cache.get(defaultErrorLogChannel);
      sendAt.send(logThis + inLogChannel.trim(),{split:true});
    } catch (errmes) {
      errLog(errmes, msg);
    }
  }
  const f = new Date().toUTCString();
  logThis = logThis+theError.stack+"\nat: "+f;
  return //console.log(logThis);
}
    /*
    fs.appendFile(join(__dirname, errLogPath + 'Error.txt'), logThis+"\n", (err) => {
      if (err) {
        console.error(err);
        fs.mkdir(join(__dirname, errLogPath), { recursive: true }, (err) => {
          if (err) {
            return console.error('Unable to create directory. Error: ' + err.stack);
          }
          console.log(errLogPath + ' created.');
          fs.writeFile(join(__dirname, errLogPath + 'Error.txt'), logThis+"\n", (err2) => {
            if (err2) {
              return console.error(err2);
            }
            console.error(logThis);
          });
        });
      }
      console.error(logThis);
    }); */

/**
 * Get message object from the message channel or provided channel
 * @param {Client} client - This client (this.client)
 * @param {Message} msg - Message object (msg)
 * @param {String} MainID - Message ID | Channel ID | Channel Mention
 * @param {String} SecondID - Message ID
 * @returns {Promise<Message>} Message object
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
      return errLog(theError, msg, client);
    }
  }
  return await msg.channel.messages.fetch(MainID).catch(e => {return errLog(e, msg, client)});
}

/**
 * Get user object
 * @param {Client} client - This client (this.client)
 * @param {String} MainID - User ID | User Mention
 * @returns {Promise<User>} User object
 * @example const user = getUser(this.client, args[0]);
 */
async function getUser(client, msg, MainID) {
  if (MainID.startsWith('<') && MainID.endsWith('>')) {
    MainID = MainID.slice(2, -1);
  }
  if (MainID.startsWith('!')) {
    MainID = (MainID.slice(1));
  }
  try {
    return await client.users.fetch(MainID);
  } catch (theError) {
    return errLog(theError, msg, client);
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

async function ranLog(msg, cmd, addition) {
  let errLogPath;
  if (msg.guild) {
    errLogPath = `../Guilds/${msg.guild.id}/Log/`;
  } else {
    errLogPath = '../Log/';
  }
  let add = '\n'+addition;
  const b = new Date().toUTCString();
  const inLog = `NEW USAGE! Message ID: ${msg.id} url: ${msg.url}\nCommand \`${cmd}\` ran by **${msg.author.tag}** (${msg.author.id}) in ${msg.guild ? `**${msg.channel.name}**` : 'DM'} (${msg.channel.id}) ${msg.guild ? `of **${msg.guild.name}** (${msg.guild.id})` : ``}${add}\nAt: ${b}`;
  return //console.log(inLog);
}
    /* fs.appendFile(join(__dirname, `${errLogPath}CmdUsage.txt`),`${inLog}\n`, e => {
      if (e) {
        fs.mkdir(join(errLogPath),{recursive:true}, e2 => {
          if (e2) {}
          fs.writeFile(join(__dirname, `${errLogPath}CmdUsage.txt`),`${inLog}\n`, e3 => {
            if (e3) {
              errLog(e3, msg);
            } else {
              console.log(`${errLogPath}CmdUsage.txt created.`);
            }
          });
        });
      }
    });
    */

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
function multipleMembersFound(client, msg, arr, key, max = 5, withID) {
  if (arr.length > 1) {
    try {
      let multipleFound = [];
      for(const one of arr) {
        let mes = one.user.tag;
        if (withID) {
          mes = mes + ` (${one.user.id})`;
        }
        multipleFound.push(mes);
      }
      let multi = [];
      for(const mu of multipleFound) {
        if (multipleFound.indexOf(mu) < max) {
          multi.push(mu);
        }
      }
      let mes = multi.join(", ");
      if (multipleFound.length > max) {
        mes = mes+` and ${multipleFound.length - max} more...`;
      }
      return `Multiple members found for: **${key}**\`\`\`md\n# ${mes}\`\`\``;
    } catch (e) {
      errLog(e, msg, client);
    }
  } else {
    return '';
  }
}

/**
 * Get member object with RegExp
 * @param {Message} msg
 * @param {String} name
 * @returns {Promise<GuildMember[]>} Member object found
 */
async function findMemberRegEx(msg, client, name) {
  let found = [];
  const re = new RegExp(name, "i");
  const list = msg.guild.members.cache.map(g => g);
  for(const mem of list) {
    if (re.test(mem.displayName) || re.test((await client.users.fetch(mem.id)).tag)) {
      found.push(mem);
    }
  }
  return found;
}

/**
 * React when it try something but fail because has not enough perms
 * @param {Message} msg 
 */
function noPerm(msg) {
  if (msg) {
    msg.react("sadduLife:797107817001386025").catch(e => {});
  }
}

/**
 * Send message
 * @param {Client} client - (this.client)
 * @param {Message | String} msg Message object | channel_ID
 * @param  {...any} content - ({content:content,optionblabla})
 * @returns {Promise<Message>} Sent message object
 */
async function trySend(client, msg, ...content) {
  //console.log(...content);
  let msgOf;
  if (msg?.channel) {
    msgOf = msg.channel;
  } else {
    msgOf = client.channels.cache.get(msg);
  }
  const sentMes = await msgOf.send(...content)
  .catch(e => {
    if (msg?.channel) {
      noPerm(msg);
    }
    return
  });
  sentAdCheck(sentMes);
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
 * @param {Message} sent - Sent message object (await msg.channel.send("discord.gg/banana"))
 */
function sentAdCheck(sent) {
  if (sent) {
    if (/(https:\/\/)?(www\.)?discord\.gg\/(?:\w{2,15}(?!\w)(?= *))/.test(sent.content)) {
      let newCont = sent.content.replace(/(https:\/\/)?(www\.)?discord\.gg\/(?:\w{2,15}(?!\w)(?= *))/, '`Some invite link goes here`');
      sent.edit(newCont, `Command abuse: Contain server invite link.`);
    }
  }
}

/**
 * Make default image embed
 * @param {Client} client 
 * @param {Message} msg 
 * @param {URL} image 
 * @param {GuildMember | User} author 
 * @param {String} title 
 * @param {String} footerText
 * @returns {Promise<MessageEmbed>}
 */
async function defaultImageEmbed(client, msg, image, author, title, footerText) {
  const { randomColors } = require("../config.json");
  let footerQuote = footerText;
  if (!footerQuote) {
    const doc = await database.collection(msg.guild ? "Guild" : "User").findOne({document: msg.guild?.id ?? msg.author.id});
    footerQuote = doc?.["settings"]?.defaultEmbed?.footerQuote || "";
  }
  let emb = new MessageEmbed();
  try {
    emb
    .setTitle(title)
    .setImage(image)
    .setColor(msg.guild ? author?.displayColor : randomColors[Math.floor(Math.random() * randomColors.length)])
    .setFooter(footerQuote);
    if (author?.displayColor === 16777215) {
      emb.setColor(16777214);
    }
  } catch (e) {
    return errLog(e, msg, client, false, "", false);
  }
  return emb;
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

module.exports = {
  cleanMentionID,
  multipleMembersFound,
  findMemberRegEx, getUser,
  getChannelMessage, errLog,
  execCB, ranLog, noPerm,
  trySend, tryDelete, tryReact,
  sentAdCheck, defaultImageEmbed }