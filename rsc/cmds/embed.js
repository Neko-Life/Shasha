'use strict';

const { BaseGuildTextChannel, Message, CommandInteraction, Util } = require("discord.js");
const { MessageEmbed } = require("discord.js");
const { Command } = require("../classes/Command");
const { getChannelMessage, isAdmin, reValidURL, allowMention } = require("../functions");
const getColor = require("../getColor");
const createJSONEmbedFields = require("../rsc/createJSONEmbedFields");
const sortProchedure = [
    'json',
    'editField',
    'edit',
    'fieldDatas',
    'title',
    'description',
    'authorName',
    'authorIcon',
    'authorUrl',
    'image',
    'thumbnail',
    'color',
    'footerText',
    'footerIcon',
    'content',
    'url',
    'attachments',
    'timestamp',
    'channel',
    'fieldName',
    'fieldText',
    'fieldInline',
    'remove'
]

module.exports.build = class BuildEmbCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "embed",
            clientPermissions: [
                "EMBED_LINKS",
                "ATTACH_FILES",
                "SEND_MESSAGES"
            ],
            userPermissions: [
                "SEND_MESSAGES",
                "ATTACH_FILES",
                "EMBED_LINKS",
                "MANAGE_MESSAGES"
            ]
        });
        this.resultMsg = "";
        this.authorEmbed = {};
        this.footerEmbed = {};
        this.fieldEmbed = {};
        this.buildEmbed = new MessageEmbed();
        this.confEmbed = {
            edit: async ({ value }) => {
                const numRe = /\(\d+\)/g;
                const num = value.match(numRe);
                if (num?.length) {
                    this.editNum = parseInt(num[0].slice(1, -1), 10);
                    value = value.replace(numRe, "").trim();
                } else this.editNum = 1;
                const args = value.split(/ +/);
                /**
                 * @type {Message}
                 */
                this.sourceMessage = await getChannelMessage(this.interaction, args[0], args[1]);
                if (!this.sourceMessage) {
                    this.error = true;
                    return this.resultMsg += "**[EDIT]** Unknown message\n";
                }
                if (!this.sourceMessage.embeds[0]) {
                    this.error = true;
                    return this.resultMsg += "**[EDIT]** No embed found in the message\n";
                }
                if (this.sourceMessage.embeds[this.editNum - 1])
                    this.buildEmbed = this.sourceMessage.embeds[this.editNum - 1];
                else {
                    this.error = true;
                    return this.resultMsg += "**[EDIT]** No embed found in position **" + this.editNum + "**\n";
                }
                this.editExist = true;

                this.contentEmbed = this.sourceMessage.content;
                if (this.editField) {
                    const field = this.buildEmbed.fields[this.editField - 1];
                    if (field) {
                        for (const F in field) {
                            this.fieldEmbed[F] = field[F];
                        }
                    }
                }
                for (const D in this.buildEmbed.author) {
                    const val = this.buildEmbed.author[D];
                    if (!val) continue;
                    this.authorEmbed[D] = val;
                }
                for (const D in this.buildEmbed.footer) {
                    const val = this.buildEmbed.footer[D];
                    if (!val) continue;
                    this.footerEmbed[D] = val;
                }
            },
            json: ({ value }) => {
                try {
                    const T = new MessageEmbed(JSON.parse(value));
                    this.buildEmbed = T;
                } catch (e) {
                    this.error = true;
                    this.resultMsg += "**[JSON]** " + e.message + "\n";
                }
            },
            title: ({ value }) => {
                this.buildEmbed.setTitle(this.interaction.client.finalizeStr(value, isAdmin(this.interaction.member || this.interaction.user)));
            },
            description: ({ value }) => {
                this.buildEmbed.setDescription(this.interaction.client.finalizeStr(value, isAdmin(this.interaction.member || this.interaction.user)));
            },
            authorName: ({ value }) => {
                this.authorEmbed.name = this.interaction.client.finalizeStr(value, isAdmin(this.interaction.member || this.interaction.user));
            },
            authorIcon: ({ value }) => {
                this.authorEmbed.iconURL = value;
            },
            authorUrl: ({ value }) => {
                this.authorEmbed.url = value;
            },
            image: ({ value }) => {
                this.buildEmbed.setImage(value);
            },
            thumbnail: ({ value }) => {
                this.buildEmbed.setThumbnail = value;
            },
            color: ({ value }) => {
                this.buildEmbed.setColor(getColor(value));
            },
            footerText: ({ value }) => {
                this.footerEmbed.text = this.interaction.client.finalizeStr(value, isAdmin(this.interaction.member || this.interaction.user));
            },
            footerIcon: ({ value }) => {
                this.footerEmbed.iconURL = value;
            },
            content: ({ value }) => {
                if (value === "EMPTY") return this.contentEmbed = null;
                this.contentEmbed = this.interaction.client.finalizeStr(value, isAdmin(this.interaction.member || this.interaction.user));
            },
            url: ({ value }) => {
                this.buildEmbed.setURL(value);
            },
            attachments: ({ value }) => {
                if (!this.filesEmbed) this.filesEmbed = [];
                const links = value.trim().split(/ +/);
                if (links.includes("copy")) this.filesEmbed.push(...this.sourceMessage.attachments.map(r => r.url));
                for (const L of links) {
                    if (L === "copy") continue;
                    if (reValidURL.test(L)) this.filesEmbed.push(L);
                    else {
                        this.resultMsg += `**${L}** isn't a valid URL\n`;
                        this.error = true;
                    }
                }
            },
            timestamp: ({ value }) => {
                if (!/\D/.test(value)) value = parseInt(value, 10);
                this.buildEmbed.setTimestamp(value);
            },
            channel: ({ channel }) => {
                this.channelSend = channel;
            },
            fieldName: ({ value }) => {
                this.fieldEmbed.name = this.interaction.client.finalizeStr(value, isAdmin(this.interaction.member || this.interaction.user));
            },
            fieldText: ({ value }) => {
                this.fieldEmbed.value = this.interaction.client.finalizeStr(value, isAdmin(this.interaction.member || this.interaction.user));
            },
            fieldInline: ({ value }) => {
                if (![`yes`, `true`, `y`, `1`].includes(value)) {
                    if (this.editField)
                        this.fieldEmbed.inline = false;
                    return;
                }
                this.fieldEmbed.inline = true;
            },
            editField: ({ value }) => {
                this.editField = value;
            },
            fieldDatas: async ({ value }) => {
                const ids = value.split(/ +/);
                const messages = [];
                for (const id of ids) {
                    const msg = await getChannelMessage(interaction, id);
                    if (!msg) {
                        this.error = true;
                        this.resultMsg += "**[FIELD_DATA]** Unknown message: **" + id + "**\n";
                        continue;
                    }
                    messages.push(msg);
                }
                let jsonData = ""
                for (const msg of messages) {
                    if (jsonData.endsWith("]```")) {
                        jsonData = jsonData.slice(0, -4);
                        const add = msg.content.slice(
                            "```js\n[".length
                        );
                        jsonData += "," + add;
                        continue;
                    }
                    jsonData += msg.content;
                }
                const sourceJson = JSON.parse(jsonData.slice(
                    "```js\n".length,
                    -3
                ));
                const toEmbedF = sourceJson.map(a => {
                    const ret = {};
                    if (a.n) ret.name = this.interaction.client.finalizeStr(a.n, isAdmin(this.interaction.member || this.interaction.user));
                    if (a.v) ret.value = this.interaction.client.finalizeStr(a.v, isAdmin(this.interaction.member || this.interaction.user));
                    if (a.i === 1) ret.inline = true;
                    if (ret.name || ret.value)
                        return ret;
                });
                this.buildEmbed.addFields(toEmbedF);
            },
            remove: ({ value }) => {
                const args = value.split(/ +/);
                if (!args?.length) return;
                for (const arg of args) {
                    if (["a", "author", "aut"].includes(arg.toLowerCase())) {
                        this.buildEmbed.author = null;
                        this.authorEmbed = {};
                        this.resultMsg += "Removed author\n";
                    } else if (["f", "field", "fields", "fi"]
                        .includes(arg.toLowerCase())) {
                        this.buildEmbed.fields = [];
                        this.resultMsg += "Removed fields\n";
                    }
                    else if (["fo", "foot", "foo", "footer"]
                        .includes(arg.toLowerCase())) {
                        this.buildEmbed.footer = null;
                        this.footerEmbed = {};
                        this.resultMsg += "Removed footer\n";
                    }
                }
            }
        };
    }

    async run(inter, data) {
        await inter.deferReply();
        const prochedure = Object.keys(data);
        prochedure.sort(
            (a, b) =>
                (
                    sortProchedure.indexOf(a)
                ) - (
                    sortProchedure.indexOf(b)
                )
        );
        for (const argName of prochedure) {
            const arg = data[argName];
            await this.confEmbed[argName](arg);
        }
        if (this.fieldEmbed.name || this.fieldEmbed.value) {
            if (this.editField) {
                if (!this.sourceMessage) {
                    this.error = true;
                    this.resultMsg += "**[EDIT_FIELD]** Can only be used with `/embed build edit` option\n";
                } else this.buildEmbed.fields.splice(this.editField - 1, 1, this.fieldEmbed);
            } else this.buildEmbed.addField(
                this.fieldEmbed.name,
                this.fieldEmbed.value,
                this.fieldEmbed.inline || false
            );
        }
        if (this.authorEmbed.name)
            this.buildEmbed.setAuthor(this.authorEmbed.name, this.authorEmbed.iconURL, this.authorEmbed.url);
        if (this.footerEmbed.text || this.footerEmbed.iconURL)
            this.buildEmbed.setFooter(this.footerEmbed.text, this.footerEmbed.iconURL);
        /**
         * @type {import("discord.js").MessageOptions}
         */
        const send = {
            allowedMentions: allowMention(inter.member, this.contentEmbed || "")
        };
        if (this.buildEmbed) {
            if (this.sourceMessage && this.editExist) {
                this.sourceMessage.embeds.splice(this.editNum - 1, 1, this.buildEmbed);
                send.embeds = this.sourceMessage.embeds;
            } else send.embeds = [this.buildEmbed];
        }
        if (this.contentEmbed) send.content = this.contentEmbed;
        if (this.filesEmbed) send.files = this.filesEmbed;
        let ret;
        if (!this.channelSend && this.sourceMessage && this.editExist) {
            if (this.sourceMessage.author !== inter.client.user) {
                this.error = true;
                this.resultMsg += "**[EDIT]** no way <:catstareLife:794930503076675584>";
            } else ret = await this.sourceMessage.edit(send);
        }
        if (send.embeds || send.content || send.files) {
            let channel = this.channelSend;
            if (!channel) channel = inter.channel;
            if (!ret) ret = await channel.send(send);
        }
        await inter.editReply(this.resultMsg +
            (this.error ? "" : "\nDone <:awamazedLife:795227334339985418>"));
        return ret;
    }
}

async function createFields(inter, fields) {
    await inter.deferReply();
    const FD_SPLIT_CONF = {
        prepend: "```js\n",
        append: "```",
        maxLength: 2000,
        char: ","
    }
    const fieldsArr = await createJSONEmbedFields(fields);
    const cont = Util.splitMessage(
        FD_SPLIT_CONF.prepend + JSON.stringify(fieldsArr) + FD_SPLIT_CONF.append,
        FD_SPLIT_CONF
    )
    const ret = [];
    for (const U of cont) {
        const res = await inter.channel.send({
            content: U
        });
        ret.push(res);
    }
    inter.editReply("Provide these message Ids to be used in `/embed build fieldDatas` command option,"
        + " separated with ` ` (space) ```js\n"
        + ret.map(r => r.id).join(" ")
        + "```");
    return ret;
}

module.exports["create-field-datas"] = class CreateFieldDatasCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "create-field-datas",
            clientPermissions: ["SEND_MESSAGES"],
            userPermissions: [
                "SEND_MESSAGES"
            ]
        });
    }

    /**
     * @param {CommandInteraction} inter
     */
    async run(inter, fields) {
        return createFields(inter, fields);
    }
}

module.exports.join = class EmbedJoinCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "join",
            clientPermissions: ["EMBED_LINKS"],
            userPermissions: ["MANAGE_MESSAGES"]
        });
    }
    async run(inter, { messages, channel, content, attachments }) {
        await inter.deferReply();
        if (!channel) channel = inter.channel;
        else channel = channel.channel;
        if (!channel.isText()) return inter.editReply("Can't send to **<#" + channel.id + ">**");
        const IDS = messages.value.split(/ +/);
        let resultMsg = "";
        const emb = [];
        for (const Id of IDS) {
            const msg = await getChannelMessage(inter, Id);
            if (!msg) {
                resultMsg += `Unknown message **${Id}**\n`;
                continue;
            }
            if (!msg.embeds.length) {
                resultMsg += `No embed in **${Id}**\n`;
                continue;
            }
            emb.push(...msg.embeds);
        }
        const send = {};
        if (content?.value) send.content = content.value;
        if (emb.length) send.embeds = emb.slice(0, 10);
        if (attachments?.value) {
            const filter = attachments.value.split(/ +/);
            const toSend = [];
            if (filter.length) for (const F of filter) {
                if (!F) continue;
                if (reValidURL.test(F)) toSend.push(F);
                else resultMsg += `**${F}** isn't a valid URL\n`;
            }
            if (toSend.length) send.files = toSend;
        }
        let ret;
        if (send.embeds || send.content) ret = await channel.send(send);
        if (emb.length > 10) resultMsg += `There's ${emb.length} embeds joined but only 10 allowed in one message\n`;
        await inter.editReply(resultMsg || "Done <:awamazedLife:795227334339985418>");
        return ret;
    }
}