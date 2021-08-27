'use strict';

const { MessageEmbed } = require("discord.js");
const { Command } = require("../../classes/Command");
const { getChannelMessage } = require("../../functions");
const getColor = require("../../getColor");

module.exports = class BuildEmbCmd extends Command {
    constructor(interaction) {
        super(interaction, { name: "embed", clientPermissions: [] });
        this.resultMsg = "";
        this.authorEmbed = {};
        this.footerEmbed = {};
        this.fieldEmbed = [];
        this.buildEmbed = new MessageEmbed();
        this.confEmbed =
        {
            edit: async ({ value }) => {
                const args = value.trim().split(/ +/);
                this.sourceMessage = await getChannelMessage(this.interaction, args[0], args[1]);
                if (!this.sourceMessage) return this.resultMsg += "**[EDIT]** Unknown message\n";
                if (!this.sourceMessage.embeds[0]) return this.resultMsg += "**[EDIT]** No embed found in the message\n";
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
                    this.resultMsg += "**[JSON]** Parse error: Invalid JSON\n";
                }
            },
            title: ({ value }) => {
                this.buildEmbed.setTitle(value);
            },
            description: ({ value }) => {
                this.buildEmbed.setDescription(value);
            },
            authorName: ({ value }) => {
                this.authorEmbed.name = { value };
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
                this.footerEmbed.text = value;
            },
            footerIcon: ({ value }) => {
                this.footerEmbed.iconURL = value;
            },
            content: ({ value }) => {
                this.contentEmbed = value;
            },
            url: ({ value }) => {
                this.buildEmbed.setURL(value);
            },
            attachments: ({ value }) => {
                this.buildEmbed.attachFiles(value.trim().split(/ +/));
            },
            timestamp: ({ value }) => {
                if (!/\D/.test(value)) value = parseInt(value, 10);
                this.buildEmbed.setTimestamp(value);
            },
            channel: ({ channel }) => {
                this.channelSend = channel;
            },
            fieldName: ({ value }) => {
                this.fieldEmbed.name = value;
            },
            fieldText: ({ value }) => {
                this.fieldEmbed.value = value;
            },
            fieldInline: ({ value }) => {
                if (![`yes`, `true`, `y`, `1`].includes(value)) return;
                this.fieldEmbed.inline = true;
            },
            fieldDatas: ({ value }) => { }
        };
    }

    async run(inter, data) {
        for (const argName in data) {
            const arg = data[argName];
            await this.confEmbed[argName](arg);
        }
        const send = {
            embed: this.buildEmbed
        }
        if (this.contentEmbed) send.content = this.contentEmbed;
        const ret = await inter.channel.send()
    }
}
