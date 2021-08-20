'use strict';

const commando = require("@iceprod/discord.js-commando");
const { MessageEmbed } = require("discord.js");
const { trySend, findMemberRegEx, multipleMembersFound, cleanMentionID, tryReact, parseComa, parseDoubleDash } = require("../../resources/functions");
const { randomColors } = require("../../config.json");

module.exports = class avatar extends commando.Command {
  constructor(client) {
    super(client, {
      name: "avatar",
      aliases: ["av", "avat"],
      memberName: "avatar",
      group: "profile",
      description: "Avatar showcase."
    });
  }
  async run(msg, arg) {
    const doc = msg.guild?.DB || msg.author.DB;
    const footerQuote = doc.defaultEmbed?.footerQuote || "";
    const option = "";// || arg.match(/(?<!\\)--s +\d+/)?.[0];
    let user, avatar, member, show, notFound = "";
    let [allEmb, multipleMemMes, dupliCheck] = [[], [], []];
    if (!arg) {
      user = msg.guild ? msg.member : msg.author;
      avatar = msg.author.displayAvatarURL({ format: "png", size: 4096, dynamic: true });
    }
    let onceOnly = false;
    const args = parseComa(arg);
    if (msg.guild ? !msg.member.hasPermission("MANAGE_MESSAGES") : false) {
      onceOnly = true;
      if (args.length > 1) tryReact(msg, "cathmmLife:772716381874946068");
    }
    if (option) {
      const theVal = option.match(/\d+/)?.[0];
      if (theVal) show = parseInt(theVal.trim(), 10);
    }
    if (arg) {
      for (const theAvThis of args) {
        let avThis = theAvThis.replace(/(?<!\\)--s +\d+/, "");
        let uID = cleanMentionID(avThis.trim());
        if (uID?.length > 0) {
          let ree = [];
          if (/^\d{17,19}$/.test(uID)) {
            const findmem = msg.guild?.member(uID);
            if (findmem) ree.push(findmem.user); else await this.client.users.fetch(uID).then(fetchUser => ree.push(fetchUser)).catch(() => { });
          } else ree = findMemberRegEx(msg, uID).map(r => r.user);
          if (ree.length > 0) {
            const duplicateRes = dupliCheck.findIndex(yes => yes === ree[0].id);
            if (duplicateRes !== -1) {
              if (allEmb[duplicateRes].description !== null) {
                allEmb[duplicateRes].setDescription(allEmb[duplicateRes].description.slice(0, -2) + ", " + avThis.trim() + "**");
              } else allEmb[duplicateRes].setDescription(`Duplicate result for: **${avThis.trim()}**`);
              user = undefined;
            } else {
              dupliCheck.push(ree[0].id);
              user = ree[0];
              //multipleMemMes.push(multipleMembersFound(msg, ree.slice(1), uID, show));
            }
          } else {
            user = undefined;
            notFound += `Can't find user: **${avThis.trim()}**\n`;
          }
          if (user) {
            avatar = user.displayAvatarURL({ format: "png", size: 4096, dynamic: true });
            let emb = new MessageEmbed()
              .setImage(avatar)
              .setFooter(footerQuote);
            member = msg.guild ? msg.guild.member(user) : undefined;
            if (member) {
              emb.setTitle(member.displayName);
              if (member.displayColor) emb.setColor(member.displayColor);
            } else emb.setTitle(user.username);
            if (!msg.guild) emb.setColor(randomColors[Math.floor(Math.random() * randomColors.length)]);
            if (emb.color === 16777215) emb.setColor(16777214);
            allEmb.push(emb);
          }
        }
        if (onceOnly) break;
      }
    } else {
      let emb = new MessageEmbed()
        .setTitle(user.displayName || user.username)
        .setImage(avatar)
        .setFooter(footerQuote);
      if (user.displayColor) emb.setColor(user.displayColor);
      if (!msg.guild) emb.setColor(randomColors[Math.floor(Math.random() * randomColors.length)]);
      if (emb.color === 16777215) emb.setColor(16777214);
      allEmb.push(emb);
    }
    let retSent = [];
    if (notFound.length > 0) retSent.push(notFound);
    for (let index = 0; index < allEmb.length; index++) {
      const embelement = allEmb[index];
      const contelement = "" || multipleMemMes[index];
      retSent.push({ embed: embelement, content: contelement, split: { maxLength: 2000, char: "", append: '```', prepend: '```js' } });
    }
    return retSent.map(r => trySend(this.client, msg, r));
  }
};