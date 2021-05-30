'use strict';

const commando = require("@iceprod/discord.js-commando");
const { MessageEmbed } = require("discord.js");
const { getChannelMessage, errLog, noPerm, tryReact, trySend, ranLog } = require("../../resources/functions");
const { database } = require("../../database/mongo");
const col = database.collection("Guild");

module.exports = class newquoteotd extends commando.Command {
    constructor(client) {
        super(client, {
            name: "newquoteotd",
            memberName: "newquoteotd",
            group: "utility",
            description: "The Life exclusive command for Quote of the day.",
            guildOnly: true,
            userPermissions:["ADMINISTRATOR"]
        });
    }
    async run(msg, arg) {
        const args = arg.trim().split(/ +/);
        const colorConf = require(`../../config.json`);
        const findDoc = await col.findOne({document: msg.guild.id});
        const quoteOTD = findDoc?.["settings"]?.quoteOTD;
        const color = colorConf.randomColors;
        if (!quoteOTD || !quoteOTD.channel) {
            return trySend(this.client, msg, `Quote OTD channel not set! Run \`${msg.guild.commandPrefix}quoteotd\` to set one.`);
        }
        if (!args[0]) {
            return trySend(this.client, msg, 'Provide `<message_ID>`!');
        }
        try {
            let emb = new MessageEmbed();
            const mes = await getChannelMessage(this.client,msg,args[0],args[1]);
            if (mes) {
                const author = mes.guild.member(mes.author);
                let description = mes.content;
                if (!description.endsWith('.')) {
                    description = description+'.';
                }
                const thumbnail = mes.author.displayAvatarURL({size:4096,dynamic:true});
                let name;
                if (author.displayName) {
                    name = author.displayName;
                } else {
                    name = author.username;
                }
                emb
                .setTitle(name)
                .setDescription(description)
                .setThumbnail(thumbnail)
                .setFooter(quoteOTD.footerText, quoteOTD.footerIcon)
                .setColor(color[Math.floor(Math.random()*color.length)]);
                const sent = trySend(this.client, quoteOTD.channel, emb);
                if (sent) {
                    tryReact(msg, "a:yesLife:794788847996370945");
                }
                return sent;
            }
            ranLog(this.client, msg, "New quote: " + msg.content + "\nBy: " + mes.author.tag + ` (${mes.author.id})`);
            return trySend(this.client, msg, 'No message with that ID from this channel. Use `[<channel_[mention, ID]> <message_ID>, message_link]` if it\'s in another channel.');
        } catch (e) {
            noPerm(msg);
            return errLog(e, msg, this.client, true, "", true);
        }
    }
};