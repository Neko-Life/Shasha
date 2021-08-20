'use strict';

const { MessageEmbed } = require("discord.js");
const { Command } = require("../../classes/Command");

module.exports = class BuildEmbCmd extends Command {
    constructor(interaction) {
        super(interaction, { name: "embed" });
        this.buildEmbed = new MessageEmbed();
        this.confEmbed =
        {
            edit: (arg) => { },
            json: () => { },
            title: () => { },
            description: () => { },
            authorName: () => { },
            authorIcon: () => { },
            authorUrl: () => { },
            image: () => { },
            thumbnail: () => { },
            color: () => { },
            footerText: () => { },
            footerIcon: () => { },
            content: () => { },
            url: () => { },
            attachments: () => { },
            timestamp: () => { },
            channel: () => { },
            fieldName: () => { },
            fieldText: () => { },
            fieldInline: () => { },
            fieldDatas: () => { }
        };
    }

    async run(inter, data) {
        for (const argName in data) {
            const arg = data[argName];
            await this.confEmbed[argName](arg);
        }
    }
}
