'use strict';

const commando = require("@iceprod/discord.js-commando");
const { MessageEmbed } = require("discord.js");
const { ranLog, errLog, trySend, findMemberRegEx, multipleMembersFound } = require("../../resources/functions");
const { database } = require("../../database/mongo");
const { randomColors } = require("../../config.json");

module.exports = class avatar extends commando.Command {
  constructor(client) {
    super(client, {
      name: "avatar",
      aliases:["av","avat"],
      memberName: "avatar",
      group: "utility",
      description: "Avatar showcase."
    });
  }
  /**
   * 
   * @param {commando.CommandoMessage} msg 
   * @param {*} arg 
   */
  async run(msg, arg) {
    const doc = msg.guild?.id ?? msg.author.id;
    const config = database.collection(msg.guild ? "Guild" : "User");
    config.findOne({document: doc}, async (docErr, r) => {
      if (docErr) {
        errLog(docErr, msg, this.client);
      }
      const footerQuote = r?.["settings"]?.defaultEmbed?.footerQuote;
      const withPerm = arg.trim().split(/,/);
      const option = arg.trim().split(/(\-\-)+/);
      let user, avatar, member, show;
      let [allEmb, multipleMemMes, dupliCheck] = [[], [], []];
      if (!arg) {
        user = msg.guild ? msg.guild.member(msg.author) : msg.author;
        avatar = msg.author.displayAvatarURL({size:4096,dynamic:true});
      }
      let args;
      if (!msg.guild || msg.guild.member(msg.author).hasPermission("MANAGE_MESSAGES")) {
        args = withPerm;
      } else {
        args = withPerm[0];
        if (withPerm.length > 1) {
          trySend(this.client, msg, "Manage messages permission required to show two or more avatar at once!");
        }
      }
      for (const ops of option) {
        if (ops.toLowerCase().startsWith("show")) {
          const val = ops.trim().split(/ +/);
          const theVal = val[1]?.trim().replace(",", "");
          if (theVal && !/\D/.test(theVal)) {
            show = parseInt(val[1].trim(), 10);
          }
        }
      }
      if (arg) {
        for(const theAvThis of args) {
          const avThis = theAvThis.replace(/\-\-show *\d*/i, "");        
          let uID = avThis.trim();
          if (uID.startsWith('<@')) {
            uID = uID.slice(2);
          }
          if (uID.startsWith('!')) {
            uID = uID.slice(1);
          }
          if (uID.endsWith('>')) {
            uID = uID.slice(0,-1)
          }
          if (uID.startsWith("@")) {
            uID = uID.slice(1);
          }
          if (uID.length === 1) {
            return trySend(this.client, msg, "One character for searching member isn't allowed <:catstareLife:794930503076675584>");
          } else {
            if (uID) {
              let ree = [];
              async function nonDigit(client) {
                const theree = await findMemberRegEx(msg, client, uID);
                if (theree.length === 0) {
                  user = undefined;
                  trySend(client, msg, `Can't find user: **${avThis.trim()}**`);
                }
                for (const reeRes of theree) {
                  ree.push(reeRes);
                }
              }
              if (/\D/.test(uID)) {
                await nonDigit(this.client);
              } else {
                if (msg.guild.member(uID)) {
                  ree.push(msg.guild.member(uID));
                } else {
                  await this.client.users.fetch(uID).then(r => ree.push(r)).catch(async e => await nonDigit(this.client));
                }
              }
              if (ree.length > 0) {
                const duplicateRes = dupliCheck.findIndex(yes => yes === ree[0].id);
                if (duplicateRes !== -1) {
                  allEmb[duplicateRes].setDescription(`Duplicate result for: **${avThis.trim()}**`);
                  user = undefined;
                } else {
                  dupliCheck.push(ree[0].id);
                  user = ree[0].user ?? ree[0];
                  multipleMemMes.push(await multipleMembersFound(this.client, msg, ree, uID, show));
                }
              }
              if (user) {
                avatar = user.displayAvatarURL({size:4096,dynamic:true});
                let emb = new MessageEmbed()
                .setImage(avatar)
                .setFooter(footerQuote ?? "");
                member = msg.guild ? msg.guild.member(user) : undefined;
                if (member) {
                  emb.setTitle(member.displayName);
                  if (member.displayColor) {
                    emb.setColor(member.displayColor)
                  }
                } else {
                  emb.setTitle(user.username);
                }
                if (!msg.guild) {
                  emb.setColor(randomColors[Math.floor(Math.random() * randomColors.length)]);
                }
                if (emb.color === 16777215) {
                  emb.setColor(16777214);
                }
                allEmb.push(emb);
              }
            }
          }
        }
      } else {
        let emb = new MessageEmbed()
        .setTitle(user.displayName ?? user.username)
        .setImage(avatar)
        .setFooter(footerQuote ?? "");
        if (user.displayColor) {
          emb.setColor(user.displayColor);
        }
        if (!msg.guild) {
          emb.setColor(randomColors[Math.floor(Math.random() * randomColors.length)]);
        }
        if (emb.color === 16777215) {
          emb.setColor(16777214);
        }
        allEmb.push(emb);
      }
      for (let index = 0; index < allEmb.length; index++) {
        const embelement = allEmb[index];
        const contelement = multipleMemMes[index];
        trySend(this.client, msg, { embed: embelement, content: contelement, split:{maxLength:2000,char: ", " || ",\n" || ". " || ".\n" || "," || ".",append:',```',prepend:'```md\n# ' }}); 
      }
      return ranLog(msg,'avatar',arg);
    });
  }
};

// Old codes
    /*args = args.split(/ +/);
    try {
      let member;
      let avUrl;
      let avatar = new MessageEmbed();
      if (args[0]) {
        member = await getUser(this.client, args[0]);
      }
      if (!args[0]) {
        avUrl = msg.author.displayAvatarURL({size:4096,dynamic:true});
        avatar
        .setColor(msg.member.displayColor)
        .setTitle(msg.member.displayName);
      } else
      if (member) {
        avUrl = member.displayAvatarURL({size:4096,dynamic:true});
        try {
          avatar.setColor(msg.guild.member(member).displayColor);
        } catch (e) {errLog(e)}
        try {
          avatar
          .setTitle(msg.guild.member(member).displayName);
        } catch (e) {
          errLog(e);
          avatar
          .setTitle(member.username);
        }
      }
      if (!avUrl) {
        return msg.channel.send('Who is that? I dunno them!');
      }
      avatar
      //.setAuthor(msg.author.username, msg.author.displayAvatarURL({size:4096, dynamic:true}))
      .setImage(avUrl)
      .setFooter(footerQuote);
      msg.channel.send(avatar);
      return ranLog(msg,'avatar', `${member ? `Avatar of ${member.tag} (${member.id}): ` : `Self avatar: `} ${avUrl}`);
    } catch (e) {
      await msg.channel.send('Who is that? I dunno them!');
      return errLog(e);
    }*/