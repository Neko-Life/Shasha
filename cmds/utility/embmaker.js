'use strict';

const commando = require("@iceprod/discord.js-commando");
const { MessageEmbed } = require("discord.js");
const { ranLog, errLog, getChannelMessage, noPerm, tryReact, findChannelRegEx, trySend, cleanMentionID } = require("../../resources/functions");
const getColor = require("../../resources/getColor");

module.exports = class embmaker extends commando.Command {
    constructor(client) {
        super(client, {
            name: "embmaker",
            memberName: "embmaker",
            aliases: ["embedmaker","createmb","creatembed"],
            group: "utility",
            description: "Embed creator.",
            details:`Embed creator: You can just copy this template and remove unneeded argument. Every argument is optional.\`\`\`\n--title [text]\n--description [text]\n--author:\n    -name [text]\n    -icon [url]\n    -url [url]\n--color [hex, number, name of color]\n--image [url]\n--thumbnail [url]\n--url [url]\n--newfield:\n    -name [text]\n    -desc [text]\n    -inline (true if provided)\n--footer:\n    -text [text]\n    -icon [url]\n--content [text]\n--channel [channel_[mention, ID]]\n--timestamp [ISO 8601, UNIX Timestamp (Milliseconds)] - Use https://time.lol \n--attachments [url] - You can put [-copy] when editing to copy all the message attachments (Cannot remove existing attachment unless [--channel] provided) \`\`\`Embed editor: You can put \`\`\`--edit <[message_ID, channel_[mention, ID] message_ID]>\`\`\` as first argument to edit the embed in a message. All existing property will be replaced with provided argument. Put \`\`\`--remove [author, fields, footer]\`\`\` to remove all existing property of the provided argument in the embed.\n\nOther arguments:\`\`\`\n--quote <[message_ID, channel_[mention, ID] message_ID]> - Quote a message\`\`\``,
            ownerOnly:false,
            hidden:false
        });
    }
    /**
     * 
     * @param {commando.CommandoMessage} msg 
     * @param {*} arg 
     * @returns 
     */
    async run(msg, arg) {
        const args = arg.trim().split(/(?<!\\)(\-\-)+/);
        let embed = new MessageEmbed();
        let autName, footertext, autIcon, autUrl, footericon, content, channel, editSrc, newAttach = [], reportMessage = "";
        try {
            for(const value of args) {
                if (value.toLowerCase().startsWith("json")) {
                    embed = new MessageEmbed(JSON.parse(value.slice("json".length).trim()));
                }
                if (value.toLowerCase().startsWith('edit')) {
                    const editArg = value.slice('edit'.length).trim().split(/ +/);
                    if (editArg[0].length > 0) {
                        editSrc = await getChannelMessage(this.client, msg, editArg[0], editArg[1]);
                        if (editSrc) {
                            const editEmb = editSrc.embeds[0];
                            if (editSrc.content) {
                                content = editSrc.content;
                            }
                            if (editEmb) {
                                embed = new MessageEmbed(editEmb);
                                if (editEmb.author) {
                                    if (editEmb.author.name) {
                                        autName = editEmb.author.name;
                                    }
                                    if (editEmb.author.url) {
                                        autUrl = editEmb.author.url;
                                    }
                                    if (editEmb.author.iconURL) {
                                        autIcon = editEmb.author.iconURL;
                                    }
                                }
                                if (editEmb.footer) {
                                    if (editEmb.footer.text) {
                                        footertext = editEmb.footer.text;
                                    }
                                    if (editEmb.footer.iconURL) {
                                        footericon = editEmb.footer.iconURL;
                                    }
                                }
                            } else {
                                reportMessage += "**[EDIT]** No editable embed found.\n";
                            }
                        } else {
                            reportMessage += "**[EDIT]** Unknown message.\n";
                        }
                    } else {
                        reportMessage += "**[EDIT]** No argument provided.\n";
                    }
                }
                if (value.toLowerCase().startsWith('quote')) {
                    const quoteargs = value.slice('quote'.length).toLowerCase().trim().split(/ +/);
                    if (quoteargs[0].length > 0) {
                        await getChannelMessage(this.client, msg, quoteargs[0], quoteargs[1])
                        .then(quoteThis => {
                            if (quoteThis) {
                                const author = quoteThis.member;
                                autName = author ? author.displayName : quoteThis.author.username;
                                autIcon = quoteThis.author.displayAvatarURL({size:4096,dynamic:true});
                                autUrl = quoteThis.url;
                                embed
                                .setAuthor(author ? author.displayName : quoteThis.author.username,quoteThis.author.displayAvatarURL({size:4096,dynamic:true}),quoteThis.url)
                                .setDescription(quoteThis.content)
                                .setTimestamp(quoteThis.createdAt);
                                if (author && author.displayColor) {
                                    embed.setColor(author.displayColor);
                                }
                                if (quoteThis.attachments) {
                                    for(const attach of quoteThis.attachments) {
                                        attach.map(g => {
                                            newAttach.push(g.proxyURL);
                                        });
                                    }
                                }
                            } else {
                                reportMessage += "**[QUOTE]** Unknown message.\n";
                            }
                        });
                    } else {
                        reportMessage += "**[QUOTE]** No argument provided.\n";
                    }
                }
                if (value.toLowerCase().startsWith('remove')) {
                    const remove = value.slice('remove'.length).toLowerCase().trim().split(/ +/);
                    for(const remThis of remove) {
                        if (remThis === 'fields') {
                            embed.fields = [];
                        }
                        if (remThis === 'author') {
                            autName = null;
                            autIcon = null;
                            autUrl = null;
                            embed.author = null;
                        }
                        if (remThis === 'footer') {
                            footertext = null;
                            footericon = null;
                            embed.footer = null;
                        }
                    }
                }
                if (value.toLowerCase().startsWith('title')) {
                    embed.setTitle(value.slice('title'.length).trim().replace(/\\(?!\\)/g,''));
                }
                if (value.toLowerCase().startsWith('desc')) {
                    embed.setDescription(value.slice('desc'.length).trim().replace(/\\(?!\\)/g,''));
                }
                if (value.toLowerCase().startsWith('description')) {
                    embed.setDescription(value.slice('description'.length).trim().replace(/\\(?!\\)/g,''));
                }
                if (value.toLowerCase().startsWith("author")) {
                    const autData = value.trim().split(/( \-)+/);
                    for(const autVal of autData) {
                        if (autVal.toLowerCase().startsWith('name')) {
                            autName = autVal.slice('name'.length).trim().replace(/\\(?!\\)/g,'');
                        }
                        if (autVal.toLowerCase().startsWith('icon')) {
                            if (/^http/.test(autVal.slice('icon'.length).trim())) {
                                autIcon = autVal.slice('icon'.length).trim();
                            } else {
                                reportMessage += "**[AUTHOR]** Invalid icon URL.\n";
                                autIcon = null;
                            }
                        }
                        if (autVal.toLowerCase().startsWith('url')) {
                            if (/^http/.test(autVal.slice('url'.length).trim())) {
                                autUrl = autVal.slice('url'.length).trim();
                            } else {
                                reportMessage += "**[AUTHOR]** Invalid URL.\n";
                                autUrl = null;
                            }
                        }
                    }
                }
                if (value.toLowerCase().startsWith("color")) {
                    const colorName = value.slice("color".length).trim();
                    const color = getColor(colorName);
                    if (color) {
                        embed.setColor(color);
                    }
                }
                if (value.toLowerCase().startsWith("image")) {
                    if (/^http/.test(value.slice("image".length).trim())) {
                        embed.setImage(value.slice("image".length).trim());
                    } else {
                        reportMessage += "**[IMAGE]** Invalid URL.\n";
                        embed.setImage(null);
                    }
                }
                if (value.toLowerCase().startsWith("thumbnail")) {
                    if (/^http/.test(value.slice("thumbnail".length).trim())) {
                        embed.setThumbnail(value.slice("thumbnail".length).trim());
                    } else {
                        reportMessage += "**[THUMBNAIL]** Invalid URL.\n";
                        embed.setThumbnail(null);
                    }
                }
                if (value.toLowerCase().startsWith('url')) {
                    if (/^http/.test(value.slice("url".length).trim())) {
                        embed.setURL(value.slice("url".length).trim());
                    } else {
                        reportMessage += "**[URL]** Invalid URL.\n";
                        embed.setURL(null);
                    }
                }
                if (value.toLowerCase().startsWith('attachment')) {
                    const attach = value.slice("attachments".length).trim().split(/ +/);
                    for(const theFile of attach) {
                        if (/^http/.test(theFile)) {
                            newAttach.push(theFile);
                        } else {
                            if (theFile.toLowerCase() !== "-copy") {
                                reportMessage += "**[ATTACHMENT]** Invalid URL.\n";
                            }
                        }
                        if (theFile.toLowerCase() === '-copy' && editSrc) {
                            if (editSrc.attachments[0].length > 0) {
                                for(const attach of editSrc.attachments) {
                                    attach.map(g => {
                                        newAttach.push(g.proxyURL);
                                    });
                                }
                            } else {
                                reportMessage += "**[ATTACHMENT]** No attachment to copy.\n";
                            }
                        }
                    }
                }
                if (value.toLowerCase().startsWith("timestamp")) {
                    if(!/\D/.test(value.slice("timestamp".length).trim())) {
                        embed.setTimestamp(parseInt(value.slice("timestamp".length).trim(), 10));
                    } else {
                        if (value.slice("timestamp".length).trim().toLowerCase() === 'now') {
                            embed.setTimestamp(msg.createdAt);
                        } else {
                            embed.setTimestamp(value.slice("timestamp".length).trim());
                        }
                    }
                    if (!embed.timestamp) {
                        reportMessage += "**[TIMESTAMP]** Invalid format.\n";
                    }
                }
                if (value.toLowerCase().startsWith('footer')) {
                    const footerData = value.trim().split(/( \-)+/);
                    for(const footval of footerData) {
                        if (footval.toLowerCase().startsWith('text')) {
                            footertext = footval.slice("text".length).trim().replace(/\\(?!\\)/g,'');
                        }
                        if (footval.toLowerCase().startsWith('icon')) {
                            if (/^http/.test(footval.slice('icon'.length).trim())) {
                                footericon = footval.slice('icon'.length).trim();
                            } else {
                                reportMessage += "**[FOOTER]** Invalid icon URL.\n";
                                footericon = null;
                            }
                        }
                    }
                }
                if (value.toLowerCase().startsWith('newfield')) {
                    const fieldData = value.trim().split(/( \-)+/);
                    let fieldName,fieldValue, inline = false;
                    for(const data of fieldData) {
                        if (data.toLowerCase().startsWith('name')) {
                            fieldName = data.slice('name'.length).trim().replace(/\\(?!\\)/g,'');
                        }
                        if (data.toLowerCase().startsWith('desc')) {
                            fieldValue = data.slice('desc'.length).trim().replace(/\\(?!\\)/g,'');
                        }
                        if (data.toLowerCase().startsWith('description')) {
                            fieldValue = data.slice('description'.length).trim().replace(/\\(?!\\)/g,'');
                        }
                        if (data.toLowerCase().startsWith('inline')) {
                            inline = true;
                        }
                    }
                    if (!fieldName) {
                        fieldName = '​';
                    }
                    if (!fieldValue) {
                        fieldValue = '​';
                    }
                    embed.addField(fieldName,fieldValue,inline);
                }
                if (value.toLowerCase().startsWith('content')) {
                    content = value.slice('content'.length).trim().replace(/\\(?!\\)/g,'');
                }
                if (value.toLowerCase().startsWith('channel')) {
                    let ID = cleanMentionID(value.slice('channel'.length).trim());
                    if (ID.toLowerCase() === 'here') {
                        channel = msg.channel;
                    } else {
                        if (/^\d{17,19}$/.test(ID)) {
                            channel = msg.guild.channels.cache.get(ID);
                            if (!channel) {
                                if (this.client.owners.includes(msg.author.id)) {
                                    channel = this.client.channels.cache.get(ID);
                                }
                            }
                        } else {
                            channel = findChannelRegEx(msg, ID, ["category", "voice"])[0];
                        }
                        if (!channel) {
                            reportMessage += "**[CHANNEL]** Unknown channel.\n";
                        }
                    }
                }
            }
            if(autIcon === false) {
                if (embed.author.name) {
                    delete embed.author.name;
                }
            }
            if (!autName && autIcon) {
                autName = '​';
            }
            if (autName || autIcon && embed.author !== null) {
                embed.setAuthor(autName,autIcon,autUrl);
            }
            if (footertext || footericon && embed.footer !== null) {
                embed.setFooter(footertext,footericon);
            }
            if (embed.length === 0 && (embed.thumbnail === null || embed.thumbnail.url === null) && embed.author === null && (embed.image === null || embed.image.url === null)) {
                if (embed.timestamp) {
                    embed.setFooter('​');
                } else {
                    embed.setDescription("_ _");
                }
            }
            if (embed.color === 16777215) {
              embed.setColor(16777214);
            }
            if (embed.description === '​' && (content || newAttach.length > 0)) {
                embed = null;
            }
            if (newAttach.length > 0) {
                reportMessage += "**[ATTACHMENT]** Uploading attachments....\n";
            }
            if (reportMessage.length > 0) {
                trySend(this.client, msg, reportMessage);
            }
            if (editSrc) {
                if (channel) {
                    channel.send({content:content,embed:embed,files:newAttach}).catch(e => noPerm(msg));
                } else {
                    channel = msg.channel;
                    if (editSrc.author === this.client.user) {
                        try {
                            editSrc.edit({content:content,embed:embed,files:newAttach}).catch(e => errLog(e, msg, this.client));
                        } catch (e) {
                            try {
                                channel.send('Something\'s wrong, i can\'t edit that so here <:WhenLife:773061840351657984>');
                                channel.send({content:content,embed:embed,files:newAttach});
                            } catch (e) {
                                noPerm(msg);
                            }
                        }
                    } else {
                        try {
                            channel.send('I can\'t edit that, so here <:catstareLife:794930503076675584>');
                            channel.send({content:content,embed:embed,files:newAttach});
                        } catch (e) {
                            noPerm(msg);
                        }
                    }
                }
            } else {
                if (!channel) {
                    channel = msg.channel;
                }
                channel.send({content:content,embed:embed,files:newAttach}).catch(e => noPerm(msg));
            }
            tryReact(msg, "a:yesLife:794788847996370945");
            return ranLog(msg,'embmaker',`${arg}\nContent: ${content}\nAttachments: ${newAttach}`);
        } catch (e) {
            return errLog(e, msg, this.client, true, "", true);
        }
    }
};