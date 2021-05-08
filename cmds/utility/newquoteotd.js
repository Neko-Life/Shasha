'use strict';

const commando = require("@iceprod/discord.js-commando");
const { MessageEmbed } = require("discord.js");
const { getChannelMessage, ranLog, errLog, noPerm, tryReact, trySend } = require("../../resources/functions");
const { database } = require("../../database/mongo");
const col = database.collection("Guild");

module.exports = class newquoteotd extends commando.Command {
    constructor(client) {
        super(client, {
            name: "newquoteotd",
            memberName: "newquoteotd",
            group: "utility",
            description: "The Life exclusive command for Quote of the day.",
            guildOnly: true
        });
    }
    async run(msg, arg) {
        const args = arg.trim().split(/ +/);
        const colorConf = require(`../../config.json`);
        const findDoc = await col.findOne({document: msg.guild.id});
        const quoteOTD = findDoc?.["settings"]?.quoteOTD;
        const color = colorConf.randomColors;
        if (!quoteOTD || !quoteOTD.channel) {
            return msg.channel.send(`Quote OTD channel not set! Run \`${this.client.commandPrefix}quoteotd\` to set one.`);
        }
        if (!args[0]) {
            return msg.channel.send('Provide `<message_ID>`!');
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
                await trySend(this.client, quoteOTD.channel, emb);
                tryReact(msg, "a:yesLife:794788847996370945");
                return ranLog(msg,'newqotd',`${msg.author.tag} (${msg.author.id}) made new QOTD \`${description}\` by ${author.tag} (${author.id})`);
            }
            return msg.channel.send('No message with that ID from this channel. Use `[<channel_[mention, ID]> <message_ID>, message_link]` if it\'s in another channel.');
        } catch (e) {
            noPerm(msg);
            return errLog(e, msg, this.client, true, "", true);
        }
    }
};