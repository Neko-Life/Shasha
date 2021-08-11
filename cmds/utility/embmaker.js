"use strict";

const commando = require("@iceprod/discord.js-commando");
const { MessageEmbed, GuildChannel, Message } = require("discord.js");
const { ranLog, errLog, getChannelMessage, noPerm, tryReact, trySend, cleanMentionID, getChannel, adCheck, parseDash, reValidURL, parseDoubleDash, defaultImageEmbed } = require("../../resources/functions");
const getColor = require("../../resources/getColor");
const emoteMessage = require("../../resources/emoteMessage");
const HELP = {
    desc: `**Embed creator:** You can just copy this template and remove unneeded argument. Every argument are optional.` +
        `\n\`--j\` JSON: \`[MessageEmbed JSON Object]\`,\n\`--t\` Title: \`[text]\`,\n\`--d\` Description: \`[text]\`,\n\`--a\` Author:\n\`  -n\` Name: \`[text]\`,\n\`  -i\` Icon: \`[url]\`,\n` +
        `\`  -u\` URL: \`[url]\`,\n\`--c\` Color: \`[hex|number|name]\`,\n\`--i\` Image: \`[url]\`,\n\`--th\` Thumbnail: \`[url]\`,\n` +
        `\`--u\` URL: \`[url]\`,\n\`--f\` Add Field:\n\`  -n\` Name: \`[text]\`,\n\`  -d\` Description: \`[text]\`,\n\`  -i\` Inline: True if provided,\n` +
        `\`--fo\` Footer:\n\`  -t\` Text: \`[text]\`,\n\`  -i\` Icon: \`[url]\`,\n\`--co\` Content: \`[text]\`,\n\`--ch\` Channel: \`[mention|ID|name]\`,\n` +
        `\`--ti\` Timestamp: \`[ISO 8601|UNIX (Milliseconds)]\` - Use https://time.lol ,\n` +
        `\`--at\` Attachments: \`[url]\` - You can put \`-c\` when editing to copy all existing message attachments ` +
        `(Cannot remove existing attachment unless \`--ch\` provided).\n\n**Embed editor:** ` +
        `You can put\n\`--e\` Edit: \`<[message_[ID|link]|channel_[mention|ID] message_ID]>\`` +
        `\nas first argument to edit the embed in provided message. All existing property will be replaced ` +
        `with provided argument. Put\n\`--r\` Remove [Author, Fields, Footer]: \`[a, f, fo]\`\nto remove all existing property ` +
        `of the provided argument in the embed.\n\nOther arguments:\n\`--q\` Quote: \`<[message_[ID|link]|channel_[mention|ID] message_ID]>\`` +
        ` - Quote a message.`,
    fields: [
    ]
};

module.exports = class embmaker extends commando.Command {
    constructor(client) {
        super(client, {
            name: "embmaker",
            memberName: "embmaker",
            aliases: ["embed-maker", "creat-emb", "creat-embed", "embed"],
            group: "utility",
            description: "Embed creator.",
            details: "Run the command without argument to see details."
        });
    }
    async run(msg, arg) {
        let isAdmin = true;
        if (msg.guild) isAdmin = msg.member.isAdmin;
        const args = parseDoubleDash(arg);
        let embed = new MessageEmbed();
        let autName, footertext, autIcon, autUrl, footericon, content, channel, editSrc, newAttach = [], reportMessage = "";
        try {
            if (!args?.length) {
                content = `<@${msg.author.id}>`;
                embed = defaultImageEmbed(msg, null, "Usage");
                embed.setDescription(HELP.desc);
                if (HELP.fields.length > 0) for (const u of HELP.fields) embed.addField(u.name, u.value, u.inline);
            } else for (const value of args) {
                if (value.startsWith("j ")) {
                    embed = new MessageEmbed(JSON.parse(value.slice("j ".length).trim()));
                    continue;
                }
                if (value.startsWith("e ")) {
                    const editArg = value.slice("e ".length).trim().split(/ +/);
                    if (editArg[0].length > 0) {
                        editSrc = await getChannelMessage(msg, editArg[0], editArg[1]);
                        if (editSrc && editSrc.invoker !== msg.author && !isAdmin) {
                            editSrc = undefined;
                            reportMessage += "**[EDIT]** Require Administrator.\n";
                            continue;
                        }
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
                if (value.startsWith("q ")) {
                    const quoteargs = value.slice("q ".length).trim().split(/ +/);
                    if (quoteargs[0].length > 0) {
                        await getChannelMessage(msg, quoteargs[0], quoteargs[1])
                            .then(quoteThis => {
                                if (quoteThis) {
                                    const author = quoteThis.member;
                                    autName = author ? author.displayName : quoteThis.author.username;
                                    autIcon = quoteThis.author.displayAvatarURL({ format: "png", size: 4096, dynamic: true });
                                    autUrl = quoteThis.url;
                                    embed
                                        .setAuthor(author ? author.displayName : quoteThis.author.username, quoteThis.author.displayAvatarURL({ format: "png", size: 128, dynamic: true }), quoteThis.url)
                                        .setDescription(quoteThis.content)
                                        .setTimestamp(quoteThis.createdAt);
                                    if (author && author.displayColor) {
                                        embed.setColor(author.displayColor);
                                    }
                                    if (quoteThis.attachments) {
                                        for (const attach of quoteThis.attachments) {
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
                if (value.startsWith("r ")) {
                    const r = value.slice("r ".length).toLowerCase().trim().split(/ +/);
                    for (const remThis of r) {
                        if (remThis === "f") {
                            embed.fields = [];
                        }
                        if (remThis === "a") {
                            autName = null;
                            autIcon = null;
                            autUrl = null;
                            embed.author = null;
                        }
                        if (remThis === "fo") {
                            footertext = null;
                            footericon = null;
                            embed.footer = null;
                        }
                    }
                    continue;
                }
                if (value.startsWith("t ")) {
                    const use = emoteMessage(this.client, value.slice("t ".length).trim().replace(/\\(?!\\)/g, ""));
                    embed.setTitle(isAdmin ? use : adCheck(use));
                    continue;
                }
                if (value.startsWith("d ")) {
                    let DD = value.slice("d ".length).trim();
                    let use = emoteMessage(this.client, DD.replace(/\\(?!\\)/g, ""));
                    embed.setDescription(isAdmin ? use : adCheck(use));
                    continue;
                }
                if (value.startsWith("a ")) {
                    const autData = parseDash(value);
                    for (const autVal of autData) {
                        if (autVal.startsWith("n ")) {
                            const use = autVal.slice("n ".length).trim().replace(/\\(?!\\)/g, "");
                            autName = isAdmin ? use : adCheck(use);
                            continue;
                        }
                        if (autVal.startsWith("i ")) {
                            if (reValidURL.test(autVal.slice("i ".length).trim())) {
                                autIcon = autVal.slice("i ".length).trim();
                            } else {
                                reportMessage += "**[AUTHOR]** Invalid icon URL.\n";
                                autIcon = null;
                            }
                            continue;
                        }
                        if (autVal.startsWith("u ")) {
                            if (!isAdmin) {
                                reportMessage += "**[AUTHOR]** URL requires Administrator.\n";
                                continue;
                            }
                            if (reValidURL.test(autVal.slice("u ".length).trim())) {
                                autUrl = autVal.slice("u ".length).trim();
                            } else {
                                reportMessage += "**[AUTHOR]** Invalid URL.\n";
                                autUrl = null;
                            }
                            continue;
                        }
                    }
                    continue;
                }
                if (value.startsWith("c ")) {
                    const colorName = value.slice("c ".length).trim();
                    const color = getColor(colorName);
                    if (color) {
                        embed.setColor(color);
                    }
                    continue;
                }
                if (value.startsWith("i ")) {
                    if (reValidURL.test(value.slice("i ".length).trim())) {
                        embed.setImage(value.slice("i ".length).trim());
                    } else {
                        reportMessage += "**[IMAGE]** Invalid URL.\n";
                        embed.setImage(null);
                    }
                    continue;
                }
                if (value.startsWith("th ")) {
                    if (reValidURL.test(value.slice("th ".length).trim())) {
                        embed.setThumbnail(value.slice("th ".length).trim());
                    } else {
                        reportMessage += "**[THUMBNAIL]** Invalid URL.\n";
                        embed.setThumbnail(null);
                    }
                    continue;
                }
                if (value.startsWith("u ")) {
                    if (!isAdmin) {
                        reportMessage += "**[URL]** Requires Administrator.\n";
                        continue;
                    }
                    if (reValidURL.test(value.slice("u ".length).trim())) {
                        embed.setURL(value.slice("u ".length).trim());
                    } else {
                        reportMessage += "**[URL]** Invalid URL.\n";
                        embed.setURL(null);
                    }
                    continue;
                }
                if (value.startsWith("at ")) {
                    const attach = value.slice("at ".length).trim().split(/ +/);
                    for (const theFile of attach) {
                        if (reValidURL.test(theFile)) {
                            newAttach.push(theFile);
                        } else {
                            if (theFile !== "-c") {
                                reportMessage += "**[ATTACHMENT]** Invalid URL.\n";
                            }
                        }
                        if (theFile === "-c" && editSrc) {
                            if (editSrc.attachments[0].length > 0) {
                                for (const attach of editSrc.attachments) {
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
                if (value.startsWith("ti ")) {
                    const use = value.slice("ti ".length).trim();
                    if (!/\D/.test(use)) {
                        embed.setTimestamp(parseInt(use, 10));
                    } else {
                        if (use === "now") {
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
                if (value.startsWith("fo ")) {
                    const footerData = parseDash(value);
                    for (const footval of footerData) {
                        if (footval.startsWith("t ")) {
                            const use = emoteMessage(this.client, footval.slice("t ".length).trim().replace(/\\(?!\\)/g, ""));
                            footertext = isAdmin ? use : adCheck(use);
                        }
                        if (footval.startsWith("i ")) {
                            if (reValidURL.test(footval.slice("i ".length).trim())) {
                                footericon = footval.slice("i ".length).trim();
                            } else {
                                reportMessage += "**[FOOTER]** Invalid icon URL.\n";
                                footericon = null;
                            }
                        }
                    }
                    continue;
                }
                if (value.startsWith("f ")) {
                    const fieldData = parseDash(value);
                    let fieldName, fieldValue, inline = false;
                    for (const data of fieldData) {
                        if (data.startsWith("n ")) {
                            const use = emoteMessage(this.client, data.slice("n ".length).trim().replace(/\\(?!\\)/g, ""));
                            fieldName = isAdmin ? use : adCheck(use);
                        }
                        if (data.startsWith("d ")) {
                            const use = emoteMessage(this.client, data.slice("d ".length).trim().replace(/\\(?!\\)/g, ""));
                            fieldValue = isAdmin ? use : adCheck(use);
                        }
                        if (data[0] === "i") {
                            inline = true;
                        }
                    }
                    if (!fieldName) {
                        fieldName = "​";
                    }
                    if (!fieldValue) {
                        fieldValue = "_ _";
                    }
                    embed.addField(fieldName, fieldValue, inline);
                    continue;
                }
                if (value.startsWith("co ")) {
                    const use = emoteMessage(this.client, value.slice("co ".length).trim().replace(/\\(?!\\)/g, ""));
                    content = isAdmin ? use : adCheck(use);
                    continue;
                }
                if (value.startsWith("ch ")) {
                    let ID = cleanMentionID(value.slice("ch ".length).trim());
                    channel = getChannel(msg, ID, ["category", "voice"])
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
                    continue;
                }
            }
            const PC = channel?.permissionsFor?.(msg.author).serialize();
            const PM = msg.channel.permissionsFor?.(msg.author).serialize();
            const CC = channel?.permissionsFor?.(this.client.user).serialize();
            const CM = msg.channel.permissionsFor?.(this.client.user).serialize();
            if (!(PC || PM).EMBED_LINKS) return trySend(this.client, msg, "No <a:catsmugLife:799633767848214549>");
            if (autIcon === false && embed.author.name) delete embed.author.name;
            if (!autName && autIcon) autName = "​";
            if (autName || autIcon && embed.author !== null) embed.setAuthor(autName, autIcon, autUrl);
            if (!footertext && footericon) footertext = "​";
            if (footertext || footericon && embed.footer !== null) embed.setFooter(footertext, footericon);
            if (embed.length === 0 && (embed.thumbnail === null || embed.thumbnail.url === null) && embed.author === null && (embed.image === null || embed.image.url === null) && !footericon) {
                if (embed.timestamp) embed.setFooter("​"); else {
                    content = `<@${msg.author.id}>`;
                    embed = defaultImageEmbed(msg, null, "Usage");
                    embed.setDescription(HELP.desc);
                    if (HELP.fields.length > 0) for (const u of HELP.fields) embed.addField(u.name, u.value, u.inline);
                }
            }
            if (embed.color === 16777215) embed.setColor(16777214);
            if (embed.description === "​" && (content || newAttach.length > 0)) embed = null;
            let sent = [];
            if (editSrc && editSrc.author != this.client.user && !channel) reportMessage += "I can\'t edit that, so here <:catstareLife:794930503076675584>\n";
            if (reportMessage.length > 0) sent.push(trySend(this.client, msg, reportMessage, !isAdmin));
            if (editSrc) {
                if (channel) {
                    if (msg.guild && !this.client.owners.includes(msg.author)) {
                        if (PC?.ATTACH_FILES && CC?.ATTACH_FILES && newAttach.length > 0) {
                            reportMessage += "**[ATTACHMENT]** Uploading attachments....\n";
                        } else {
                            if (newAttach.length > 0) {
                                newAttach = [];
                                reportMessage += "**[ATTACHMENT]** Missing permission.\n";
                            }
                        }
                    }
                    sent.push(trySend(this.client, channel, { content: content, embed: embed, files: newAttach }));
                } else {
                    if (msg.guild) {
                        if (PM.ATTACH_FILES === undefined && CM.ATTACH_FILES === undefined) {
                            if (newAttach.length > 0) {
                                newAttach = [];
                                reportMessage += "**[ATTACHMENT]** Missing permission.\n";
                            }
                        }
                    }
                    if (editSrc.author === this.client.user) {
                        sent.push(editSrc.edit({ content: content, embed: embed, files: newAttach }).catch(e => {
                            errLog(e, msg, this.client);
                            sent.push(trySend(this.client, msg, "Something\'s wrong, i can\'t edit that so here <:WhenLife:773061840351657984>"));
                            sent.push(trySend(this.client, msg, { content: content, embed: embed, files: newAttach }));
                        }));
                    } else {
                        sent.push(trySend(this.client, msg, { content: content, embed: embed, files: newAttach }));
                    }
                }
            } else {
                if (msg.guild && !this.client.owners.includes(msg.author)) {
                    if ((PC || PM).ATTACH_FILES && (CC || CM).ATTACH_FILES && newAttach.length > 0) {
                        reportMessage += "**[ATTACHMENT]** Uploading attachments....\n";
                    } else {
                        if (newAttach.length > 0) {
                            newAttach = [];
                            reportMessage += "**[ATTACHMENT]** Missing permission.\n";
                        }
                    }
                }
                sent.push(trySend(this.client, channel || msg.channel, { content: content, embed: embed, files: newAttach }).catch(e => noPerm(msg)));
            }
            if (await sent[0]) {
                tryReact(msg, "a:yesLife:794788847996370945");
                ranLog(msg, ("```js\n" + JSON.stringify(embed, (k, v) => v || undefined, 2) + "```"));
            } else {
                noPerm(msg);
            }
            for (const m of sent) m.then(r => {
                if (r instanceof Message) r.setInvoker(msg.author);
            });
            return sent;
        } catch (e) {
            return errLog(e, msg, this.client, true, "", true);
        }
    }
};