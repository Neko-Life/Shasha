'use strict';

const { BaseGuildTextChannel, Message } = require("discord.js");
const { MessageEmbed } = require("discord.js");
const { Command } = require("../../classes/Command");
const { getChannelMessage, finalizeStr, isAdmin } = require("../../functions");
const getColor = require("../../getColor");

module.exports = class BuildEmbCmd extends Command {
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
        this.confEmbed =
        {
            edit: async ({ value }) => {
                const args = value.trim().split(/ +/);
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
                this.buildEmbed = this.sourceMessage.embeds[0];
                this.contentEmbed = this.sourceMessage.content;
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
                    this.buildEmbed = new MessageEmbed(JSON.parse(value));
                } catch (e) {
                    this.buildEmbed = new MessageEmbed();
                    this.error = true;
                    this.resultMsg += "**[JSON]** Invalid format\n";
                }
            },
            title: ({ value }) => {
                this.buildEmbed.setTitle(finalizeStr(this.interaction.client, value, isAdmin(this.interaction.member || this.interaction.user)));
            },
            description: ({ value }) => {
                this.buildEmbed.setDescription(finalizeStr(this.interaction.client, value, isAdmin(this.interaction.member || this.interaction.user)));
            },
            authorName: ({ value }) => {
                this.authorEmbed.name = finalizeStr(this.interaction.client, value, isAdmin(this.interaction.member || this.interaction.user));
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
                this.footerEmbed.text = finalizeStr(this.interaction.client, value, isAdmin(this.interaction.member || this.interaction.user));
            },
            footerIcon: ({ value }) => {
                this.footerEmbed.iconURL = value;
            },
            content: ({ value }) => {
                if (value === "EMPTY") return this.contentEmbed = null;
                this.contentEmbed = finalizeStr(this.interaction.client, value, isAdmin(this.interaction.member || this.interaction.user));
            },
            url: ({ value }) => {
                this.buildEmbed.setURL(value);
            },
            attachments: ({ value }) => {
                if (!this.filesEmbed) this.filesEmbed = [];
                const links = value.trim().split(/ +/);
                if (links.includes("copy")) this.filesEmbed = this.sourceMessage.attachments.map(r => r.url);
                for (const L of links) {
                    if (L === "copy") continue;
                    this.filesEmbed.push(L);
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
                this.fieldEmbed.name = finalizeStr(this.interaction.client, value, isAdmin(this.interaction.member || this.interaction.user));
            },
            fieldText: ({ value }) => {
                this.fieldEmbed.value = finalizeStr(this.interaction.client, value, isAdmin(this.interaction.member || this.interaction.user));
            },
            fieldInline: ({ value }) => {
                if (![`yes`, `true`, `y`, `1`].includes(value)) return;
                this.fieldEmbed.inline = true;
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
                    if (!msg.fieldData) {
                        const dataStr = msg.content?.match(/(?<=^#fields\_data\_)\d+\.\d+(?=```)/)?.[0];
                        if (dataStr?.length) {
                            const split = dataStr.split(".");
                            msg.fieldData = parseInt(split[0]);
                            msg.fieldDataVersion = parseInt(split[1]);
                        } else {
                            this.error = true;
                            this.resultMsg += "**[FIELD_DATA]** Invalid data in message **" + id + "**\n";
                            continue;
                        }
                    }
                    messages.push(msg);
                }
                messages.sort((a, b) => {
                    if (a.fieldData === b.fieldData)
                        return a.fieldDataVersion - b.fieldDataVersion;
                    return a.fieldData - b.fieldData;
                });
                let jsonData = ""
                for (const msg of messages) {
                    if (msg.fieldDataVersion > 0 && jsonData.endsWith("```")) {
                        jsonData = jsonData.slice(0, -3);
                        const add = msg.content.slice(
                            msg.content.match(/^#fields\_data\_\d+\.\d+```js\n/)[0].length
                        );
                        jsonData += "," + add;
                        continue;
                    }
                    if (msg.fieldData > 1 && jsonData.endsWith("]```")) {
                        jsonData = jsonData.slice(0, -4);
                        const add = msg.content.slice(
                            msg.content.match(/^#fields\_data\_\d+\.\d+```js\n\[/)[0].length
                        );
                        jsonData += "," + add;
                        continue;
                    }
                    jsonData += msg.content;
                }
                if (!/^#fields\_data\_\d+\.\d+```js\n.+```/.test(jsonData)) {
                    this.resultMsg += "**[FIELD_DATAS]** Invalid: Cannot construct fields\n";
                    return this.error = true;
                }
                const sourceJson = JSON.parse(jsonData.slice(
                    jsonData.match(/^#fields\_data\_\d+\.\d+```js\n/)[0].length,
                    -3
                ));
                const toEmbedF = sourceJson.map(a => {
                    const ret = {};
                    if (a.n) ret.name = a.n;
                    if (a.v) ret.value = finalizeStr(this.interaction.client, a.v, isAdmin(this.interaction.member || this.interaction.user));
                    if (a.i) ret.inline = a.i;
                    if (ret.name || ret.value)
                        return ret;
                });
                this.buildEmbed.addFields(toEmbedF);
            },
            remove: ({ value }) => {
                const args = value.split(/ +/);
                if (!args?.length) return;
                for (const arg of args) {
                    if (["a", "author", "aut"].includes(arg)) {
                        this.buildEmbed.author = null;
                        this.authorEmbed = {};
                        this.resultMsg += "Removed author\n";
                    } else if (["f", "field", "fields", "fi"]
                        .includes(arg)) {
                        this.buildEmbed.fields = [];
                        this.resultMsg += "Removed fields\n";
                    }
                    else if (["fo", "foot", "foo", "footer"]
                        .includes(arg)) {
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
        try {
            for (const argName in data) {
                const arg = data[argName];
                await this.confEmbed[argName](arg);
            }
            if (this.fieldEmbed.name || this.fieldEmbed.value)
                this.buildEmbed.addField(this.fieldEmbed.name, this.fieldEmbed.value, this.fieldEmbed.inline || false);
            if (this.authorEmbed.name)
                this.buildEmbed.setAuthor(this.authorEmbed.name, this.authorEmbed.iconURL, this.authorEmbed.url);
            if (this.footerEmbed.text || this.footerEmbed.iconURL)
                this.buildEmbed.setFooter(this.footerEmbed.text, this.footerEmbed.iconURL);
            /**
             * @type {import("discord.js").MessageOptions}
             */
            const send = {
                embeds: [this.buildEmbed]
            }
            if (this.contentEmbed) send.content = this.contentEmbed;
            if (this.filesEmbed) send.files = this.filesEmbed;
            /**
             * @type {BaseGuildTextChannel}
             */
            let channel = this.channelSend;
            if (!channel) channel = inter.channel;
            let ret;
            if (!this.channelSend && this.sourceMessage) {
                if (this.sourceMessage.author !== inter.client.user) {
                    this.error = true;
                    this.resultMsg += "**[EDIT]** no way <:catstareLife:794930503076675584>";
                } else ret = await this.sourceMessage.edit(send);
            }
            if (!ret) ret = await channel.send(send);
            await inter.editReply(this.resultMsg +
                (this.error ? "" : "\nDone <:awamazedLife:795227334339985418>"));
            return ret;
        } catch (e) {
            return inter.editReply(e.message);
        }
    }
}