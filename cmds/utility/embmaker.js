'use strict';

const commando = require("@iceprod/discord.js-commando");
const { MessageEmbed, GuildChannel } = require("discord.js");
const { ranLog, errLog, getChannelMessage, noPerm, tryReact, trySend, cleanMentionID, getChannelProchedure, sentAdCheck } = require("../../resources/functions");
const getColor = require("../../resources/getColor");

module.exports = class embmaker extends commando.Command {
    constructor(client) {
        super(client, {
            name: "embmaker",
            memberName: "embmaker",
            aliases: ["embedmaker","createmb","creatembed"],
            group: "utility",
            description: "Embed creator.",
            details:
            `Embed creator: You can just copy this template and remove unneeded argument. Every argument are optional.` +
            `\`\`\`\n--title [text]\n--description [text]\n--author:\n    -name [text]\n    -icon [url]\n` +
            `    -url [url]\n--color [hex, number, name of color]\n--image [url]\n--thumbnail [url]\n` +
            `--url [url]\n--newfield:\n    -name [text]\n    -desc [text]\n    -inline (true if provided)\n` +
            `--footer:\n    -text [text]\n    -icon [url]\n--content [text]\n--channel [channel_[mention, ID]]\n` +
            `--timestamp [ISO 8601, UNIX Timestamp (Milliseconds)] - Use https://time.lol \n` +
            `--attachments [url] - You can put [-copy] when editing to copy all the message attachments ` +
            `(Cannot remove existing attachment unless [--channel] provided) \`\`\`Embed editor: ` +
            `You can put \`\`\`--edit <[message_ID, channel_[mention, ID] message_ID]>` +
            `\`\`\` as first argument to edit the embed in a message. All existing property will be replaced ` +
            `with provided argument. Put \`\`\`--remove [author, fields, footer]\`\`\` to remove all existing property ` +
            `of the provided argument in the embed.\n\nOther arguments:\`\`\`\n--quote <[message_ID, channel_[mention, ID] message_ID]>` +
            ` - Quote a message\`\`\``
        });
    }
    /**
     * 
     * @param {commando.CommandoMessage} msg 
     * @param {*} arg 
     * @returns 
     */
    async run(msg, arg) {
        let isAdmin = false;
        if (msg.guild) {
            if (!this.client.owners.includes(msg.author) && !msg.member.hasPermission("EMBED_LINKS")) {
                return trySend(this.client, msg, "LMFAO no");
            };
            if (msg.member.hasPermission("ADMINISTRATOR")) {
                isAdmin = true;
            };
        };
        const args = arg.trim().split(/(?<!\\)(\-\-)+/);
        let embed = new MessageEmbed();
        let autName, footertext, autIcon, autUrl, footericon, content, channel, editSrc, newAttach = [], reportMessage = "";
        try {
            for(const value of args) {
                if (value.toLowerCase().startsWith("json")) {
                    embed = new MessageEmbed(JSON.parse(value.slice("json".length).trim()));
                    continue;
                }
                if (value.toLowerCase().startsWith('edit')) {
                    if (msg.guild && !msg.member.hasPermission("MANAGE_MESSAGES")) {
                        reportMessage += "**[EDIT]** Requires Manage Messages.\n";
                        continue;
                    }
                    const editArg = value.slice('edit'.length).trim().split(/ +/);
                    if (editArg[0].length > 0) {
                        editSrc = await getChannelMessage(msg, editArg[0], editArg[1]);
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
                    continue;
                }
                if (value.toLowerCase().startsWith('quote')) {
                    const quoteargs = value.slice('quote'.length).toLowerCase().trim().split(/ +/);
                    if (quoteargs[0].length > 0) {
                        await getChannelMessage(msg, quoteargs[0], quoteargs[1])
                        .then(quoteThis => {
                            if (quoteThis) {
                                const author = quoteThis.member;
                                autName = author ? author.displayName : quoteThis.author.username;
                                autIcon = quoteThis.author.displayAvatarURL({format: "png", size: 4096, dynamic: true});
                                autUrl = quoteThis.url;
                                embed
                                .setAuthor(author ? author.displayName : quoteThis.author.username,quoteThis.author.displayAvatarURL({format: "png", size: 4096, dynamic: true}),quoteThis.url)
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
                    continue;
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
                    continue;
                }
                if (value.toLowerCase().startsWith('title')) {
                    const use = value.slice('title'.length).trim().replace(/\\(?!\\)/g,'');
                    embed.setTitle(isAdmin ? use : sentAdCheck(use));
                    continue;
                }
                if (value.toLowerCase().startsWith('desc')) {
                    const use = value.slice('desc'.length).trim().replace(/\\(?!\\)/g,'');
                    embed.setDescription(isAdmin ? use : sentAdCheck(use));
                    continue;
                }
                if (value.toLowerCase().startsWith('description')) {
                    const use = value.slice('description'.length).trim().replace(/\\(?!\\)/g,'');
                    embed.setDescription(isAdmin ? use : sentAdCheck(use));
                    continue;
                }
                if (value.toLowerCase().startsWith("author")) {
                    const autData = value.trim().split(/( \-)+/);
                    for(const autVal of autData) {
                        if (autVal.toLowerCase().startsWith('name')) {
                            const use = autVal.slice('name'.length).trim().replace(/\\(?!\\)/g,'');
                            autName = isAdmin ? use : sentAdCheck(use);
                            continue;
                        }
                        if (autVal.toLowerCase().startsWith('icon')) {
                            if (/^https?:\/\/\w+\.\w\w/.test(autVal.slice('icon'.length).trim())) {
                                autIcon = autVal.slice('icon'.length).trim();
                            } else {
                                reportMessage += "**[AUTHOR]** Invalid icon URL.\n";
                                autIcon = null;
                            }
                            continue;
                        }
                        if (autVal.toLowerCase().startsWith('url')) {
                            if (!isAdmin) {
                                reportMessage += "**[AUTHOR]** URL requires Administrator.\n";
                                continue;
                            }
                            if (/^https?:\/\/\w+\.\w\w/.test(autVal.slice('url'.length).trim())) {
                                autUrl = autVal.slice('url'.length).trim();
                            } else {
                                reportMessage += "**[AUTHOR]** Invalid URL.\n";
                                autUrl = null;
                            }
                            continue;
                        }
                    }
                    continue;
                }
                if (value.toLowerCase().startsWith("color")) {
                    const colorName = value.slice("color".length).trim();
                    const color = getColor(colorName);
                    if (color) {
                        embed.setColor(color);
                    }
                    continue;
                }
                if (value.toLowerCase().startsWith("image")) {
                    if (/^https?:\/\/\w+\.\w\w/.test(value.slice("image".length).trim())) {
                        embed.setImage(value.slice("image".length).trim());
                    } else {
                        reportMessage += "**[IMAGE]** Invalid URL.\n";
                        embed.setImage(null);
                    }
                    continue;
                }
                if (value.toLowerCase().startsWith("thumbnail")) {
                    if (/^https?:\/\/\w+\.\w\w/.test(value.slice("thumbnail".length).trim())) {
                        embed.setThumbnail(value.slice("thumbnail".length).trim());
                    } else {
                        reportMessage += "**[THUMBNAIL]** Invalid URL.\n";
                        embed.setThumbnail(null);
                    }
                    continue;
                }
                if (value.toLowerCase().startsWith('url')) {
                    if (!isAdmin) {
                        reportMessage += "**[URL]** Requires Administrator.\n";
                        continue;
                    }
                    if (/^https?:\/\/\w+\.\w\w/.test(value.slice("url".length).trim())) {
                        embed.setURL(value.slice("url".length).trim());
                    } else {
                        reportMessage += "**[URL]** Invalid URL.\n";
                        embed.setURL(null);
                    }
                    continue;
                }
                if (value.toLowerCase().startsWith('attachment')) {
                    const attach = value.slice("attachments".length).trim().split(/ +/);
                    for(const theFile of attach) {
                        if (/^https?:\/\/\w+\.\w\w/.test(theFile)) {
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
                    continue;
                }
                if (value.toLowerCase().startsWith("timestamp")) {
                    const use = value.slice("timestamp".length).trim();
                    if(!/\D/.test(use)) {
                        embed.setTimestamp(parseInt(use, 10));
                    } else {
                        if (use.toLowerCase() === 'now') {
                            embed.setTimestamp(msg.createdAt);
                        } else {
                            embed.setTimestamp(use);
                        }
                    }
                    if (!embed.timestamp) {
                        if (use.length > 0) {
                            reportMessage += "**[TIMESTAMP]** Invalid format.\n";
                        } else {
                            reportMessage += "**[TIMESTAMP]** Cleared.\n";
                        }
                    }
                    continue;
                }
                if (value.toLowerCase().startsWith('footer')) {
                    const footerData = value.trim().split(/( \-)+/);
                    for(const footval of footerData) {
                        if (footval.toLowerCase().startsWith('text')) {
                            const use = footval.slice("text".length).trim().replace(/\\(?!\\)/g,'');
                            footertext = isAdmin ? use : sentAdCheck(use);
                        }
                        if (footval.toLowerCase().startsWith('icon')) {
                            if (/^https?:\/\/\w+\.\w\w/.test(footval.slice('icon'.length).trim())) {
                                footericon = footval.slice('icon'.length).trim();
                            } else {
                                reportMessage += "**[FOOTER]** Invalid icon URL.\n";
                                footericon = null;
                            }
                        }
                    }
                    continue;
                }
                if (value.toLowerCase().startsWith('newfield')) {
                    const fieldData = value.trim().split(/( \-)+/);
                    let fieldName,fieldValue, inline = false;
                    for(const data of fieldData) {
                        if (data.toLowerCase().startsWith('name')) {
                            const use = data.slice('name'.length).trim().replace(/\\(?!\\)/g,'');
                            fieldName = isAdmin ? use : sentAdCheck(use);
                        }
                        if (data.toLowerCase().startsWith('desc')) {
                            const use = data.slice('desc'.length).trim().replace(/\\(?!\\)/g,'');
                            fieldValue = isAdmin ? use : sentAdCheck(use);
                        }
                        if (data.toLowerCase().startsWith('description')) {
                            const use = data.slice('description'.length).trim().replace(/\\(?!\\)/g,'');
                            fieldValue = isAdmin ? use : sentAdCheck(use);
                        }
                        if (data.toLowerCase().startsWith('inline')) {
                            inline = true;
                        }
                    }
                    if (!fieldName) {
                        fieldName = '​';
                    }
                    if (!fieldValue) {
                        fieldValue = '_ _';
                    }
                    embed.addField(fieldName, fieldValue, inline);
                    continue;
                }
                if (value.toLowerCase().startsWith('content')) {
                    const use = value.slice('content'.length).trim().replace(/\\(?!\\)/g,'');
                    content = isAdmin ? use : sentAdCheck(use);
                    continue;
                }
                if (value.toLowerCase().startsWith('channel')) {
                    let ID = cleanMentionID(value.slice('channel'.length).trim());
                    if (ID.toLowerCase() === 'here') {
                        channel = msg.channel;
                    } else {
                        channel = getChannelProchedure(msg, ID)
                        if (!channel) {
                            reportMessage += "**[CHANNEL]** Unknown channel.\n";
                        } else {
                            if ((channel instanceof GuildChannel) && !this.client.owners.includes(msg.author)) {
                                const p = channel.permissionsFor(msg.author).serialize(),
                                f = channel.permissionsFor(this.client.user).serialize();
                                if (!p.EMBED_LINKS || !p.SEND_MESSAGES || !p.VIEW_CHANNEL || !f.EMBED_LINKS || !f.SEND_MESSAGES) {
                                    channel = undefined;
                                    reportMessage += "**[CHANNEL]** Missing permission.\n";
                                }
                            }
                        }
                    }
                    continue;
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
            let sent = [];
            if (reportMessage.length > 0) {
                sent.push(trySend(this.client, msg, reportMessage, !isAdmin));
            }
            if (editSrc) {
                if (channel) {
                    if (msg.guild && !this.client.owners.includes(msg.author)) {
                        if (channel.permissionsFor(msg.author).serialize().ATTACH_FILES && channel.permissionsFor(this.client.user).serialize().ATTACH_FILES && newAttach.length > 0) {
                            reportMessage += "**[ATTACHMENT]** Uploading attachments....\n";
                        } else {
                            if (newAttach.length > 0) {
                                newAttach = [];
                                reportMessage += "**[ATTACHMENT]** Missing permission.\n";
                            }
                        }
                    }
                    sent.push(trySend(this.client, channel, {content:content,embed:embed,files:newAttach}));
                } else {
                    if (msg.guild) {
                        const c = msg.channel.permissionsFor(msg.author).serialize(),
                        f = msg.channel.permissionsFor(this.client.user).serialize();
                        if (!c.ATTACH_FILES && !f.ATTACH_FILES) {
                            if (newAttach.length > 0) {
                                newAttach = [];
                                reportMessage += "**[ATTACHMENT]** Missing permission.\n";
                            }
                        }
                    }
                    if (editSrc.author === this.client.user) {
                        sent.push(editSrc.edit({content:content,embed:embed,files:newAttach}).catch(e => {
                            errLog(e, msg, this.client);
                            sent.push(trySend(this.client, msg, 'Something\'s wrong, i can\'t edit that so here <:WhenLife:773061840351657984>'));
                            sent.push(trySend(this.client, msg, {content:content,embed:embed,files:newAttach}));
                        }));
                    } else {
                        sent.push(trySend(this.client, msg, 'I can\'t edit that, so here <:catstareLife:794930503076675584>'));
                        sent.push(trySend(this.client, msg, {content:content,embed:embed,files:newAttach}));
                    }
                }
            } else {
                if (msg.guild && !this.client.owners.includes(msg.author)) {
                    if ((channel ?? msg.channel).permissionsFor(msg.author).serialize().ATTACH_FILES && (channel ?? msg.channel).permissionsFor(this.client.user).serialize().ATTACH_FILES && newAttach.length > 0) {
                        reportMessage += "**[ATTACHMENT]** Uploading attachments....\n";
                    } else {
                        if (newAttach.length > 0) {
                            newAttach = [];
                            reportMessage += "**[ATTACHMENT]** Missing permission.\n";
                        }
                    }
                }
                sent.push(trySend(this.client, channel ?? msg.channel, {content:content, embed:embed, files:newAttach}).catch(e => noPerm(msg)));
            }
            if (await sent[0]) {
                tryReact(msg, "a:yesLife:794788847996370945");
            } else {
                return noPerm(msg);
            }
            ranLog(msg, ("```js\n" + JSON.stringify(embed, (k, v) => v ?? undefined, 2) + "```"));
            return sent;
        } catch (e) {
            return errLog(e, msg, this.client, true, "", true);
        }
    }
};