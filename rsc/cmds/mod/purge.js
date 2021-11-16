'use strict';

const { MessageEmbed } = require("discord.js");
const { escapeRegExp } = require("lodash");
const { Command } = require("../../classes/Command");
const { logDev } = require("../../debug");
const { getColor } = require("../../functions");
const { checkCmd } = require("../../handlers/command");

module.exports = class PurgeCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "purge",
            userPermissions: ["MANAGE_MESSAGES"],
            clientPermissions: ["MANAGE_MESSAGES"],
            guildOnly: true
        });
    }
    async run(inter, {
        amount,
        channel,
        filterUser,
        filterContent,
        filterRegex,
        toMessage,
        attachmentOnly,
        botOnly,
        webhookOnly,
        includePinned
    }) {
        if (!(amount || toMessage))
            return inter.reply("0 message purged wow tysm the chat already clean <33");

        /**
         * @type {import("discord.js").TextBasedChannels}
         */
        let inChannel;
        if (channel) {
            if (!channel.channel.isText())
                return inter.reply("That channel has no message in it :/");
            const oriChan = inter.channel;

            Object.defineProperty(inter, "channel", {
                configurable: true,
                value: channel.channel,
                writable: true
            });

            const cmd = await checkCmd(inter, this);
            if (!cmd) return;
            else inter.channel = oriChan;
            inChannel = channel.channel;
        } else inChannel = this.channel;

        let useCache = inChannel.messages.cache.filter(
            r => r.deleted === false && (includePinned?.value === "1" ? true : r.pinned === false));

        if (webhookOnly) {
            if (webhookOnly.value === "1")
                useCache = useCache.filter(r => r.webhookId);
            else useCache = useCache.filter(r => !r.webhookId);
        }

        if (botOnly) {
            if (botOnly.value === "1")
                useCache = useCache.filter(r => r.author?.bot);
            else useCache = useCache.filter(r => r.author && !r.author.bot);
        }

        if (attachmentOnly) {
            if (attachmentOnly.value === "1")
                useCache = useCache.filter(r => r.attachments.size || r.embeds.length);
            else useCache = useCache.filter(r => !r.attachments.size && !r.embeds.length);
        }

        if (toMessage) {
            if (/\//.test(toMessage.value)) {
                const u = toMessage.value.split("/");
                toMessage.value = u[u.length - 1];
            }
            if (/^\d{18,20}$/.test(toMessage.value)) {
                const compId = parseInt(toMessage.value);
                useCache = useCache.filter(r => parseInt(r.id, 10) > compId)
            } else return inter.reply("Invalid to-message argument. Provide message `Id` or `link` from the channel");
        }

        let filtered = [];
        if (filterUser) {
            useCache = useCache.filter(r => r.author?.id === filterUser.user.id);
            if (!(filterContent || filterRegex)) {
                filtered = useCache.map(r => r);
                if (noLenRet()) return;
            }
        }

        if (filterContent) {
            const re = new RegExp(escapeRegExp(filterContent.value), "i");
            for (const [k, v] of useCache)
                if (re.test(v.content) || re.test(v.cleanContent))
                    if (filtered.find(r => r.id === v.id)) continue;
                    else filtered.push(v);
        }

        if (filterRegex) {
            const source = filterRegex.value.split("/");
            const re = new RegExp(source[1], source[3] || "");
            for (const [k, v] of useCache)
                if (re.test(v.content) || re.test(v.cleanContent))
                    if (filtered.find(r => r.id === v.id)) continue;
                    else filtered.push(v);
        }

        if (filterUser
            || filterContent
            || filterRegex
        ) {
            if (noLenRet()) return;
        } else filtered = useCache.map(r => r);

        let del = amount?.value ?? filtered.length;

        const deleted = await inChannel.bulkDelete(
            filtered.length
                ? filtered.reverse().slice(0, del > 100 ? 100 : del)
                : del, true);

        const ret = await inter.reply({
            content: "Purged `" + deleted.size + "` message"
                + (deleted.size > 1 ? "s" : "")
                + (del > 100
                    ? (
                        filtered.length > 100
                            ? "\nMatched " + filtered.length + " messages but c"
                            : "\nC"
                    ) + "an only purge up to 100 messages. Sorry :c" : ""),
            fetchReply: true
        });
        setTimeout(() => ret.deleted ? null : ret.delete(), 15000);
        logDev(deleted);
        return deleted;

        function noLenRet() {
            if (filtered.length) return false;
            inter.reply("Your filter doesn't match any message");
            return true;
        }
    }
}