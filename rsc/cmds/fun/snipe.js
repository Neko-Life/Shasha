'use strict';

const { MessageEmbed } = require("discord.js");
const { Command } = require("../../classes/Command");
const { getColor, prevNextButton, isAdmin } = require("../../functions");
const CommandHandler = require("../../handlers/command");

module.exports = class SnipeCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "snipe",
            clientPermissions: ["VIEW_CHANNEL", "EMBED_LINKS"],
            deleteSavedMessagesAfter: 15000
        });
    }
    async run(inter, { channel }) {
        if (channel?.channel)
            if (
                !await CommandHandler.checkCmd(
                    inter, this,
                    { overridePermissionsToChannel: channel.channel }
                )
            ) return;
        await inter.deferReply();
        const pages = [];
        if ((channel?.channel || this.channel).deletedMessages)
            for (const [k, v] of (channel?.channel || this.channel).deletedMessages) {
                if (v.author?.bot) continue;
                if (!v.deleted) continue;
                if (!v.content && !v.attachments.size) continue;
                const emb = new MessageEmbed()
                    .setAuthor({
                        name: v.member?.displayName || v.author.username,
                        iconURL: (v.member || v.author).displayAvatarURL({ size: 128, format: "png", dynamic: true }),
                        url: v.url
                    }).setDescription(this.client.finalizeStr(v.content, isAdmin(v.member)))
                    .setColor(getColor(v.author.accentColor, true, v.member?.displayColor));
                if (v.attachments.size)
                    emb.setImage(v.attachments.first().url);
                else emb.setImage(null);
                pages.push({ embeds: [emb] });
            }
        if (!pages.length) return this.saveMessages(inter.editReply("Nothin to snipe"));
        if (pages.length > 1 && (this.isOwner || this.member?.permissionsIn(this.channel).has("MANAGE_MESSAGES"))) {
            const button = prevNextButton(true);
            for (let i = 0; i < pages.length; i++) pages[i].components = [button];
        }
        pages.reverse();
        const ret = await inter.editReply({ ...pages[0], fetchReply: true });
        this.client.createMessageInteraction(ret.id, { CURRENT_PAGE: 0, PAGES: pages });
        return ret;
    }
}