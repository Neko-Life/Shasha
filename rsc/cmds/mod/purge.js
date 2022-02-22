"use strict";

const { escapeRegExp } = require("lodash");
const { Command } = require("../../classes/Command");
const { logDev } = require("../../debug");
const { checkCmd } = require("../../handlers/command");

module.exports = class PurgeCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "purge",
            userPermissions: ["MANAGE_MESSAGES"],
            clientPermissions: ["MANAGE_MESSAGES"],
            guildOnly: true,
            deleteSavedMessagesAfter: 10000
        });
    }
    async run(inter, {
        amount,
        channel,
        filterUserIds,
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
            return this.saveMessages(inter.reply("0 message purged wow tysm the chat already clean <33"));

        /**
         * @type {import("discord.js").TextChannel}
         */
        let inChannel;
        if (channel) {
            if (!channel.channel.isText())
                return this.saveMessages(inter.reply("That channel has no message in it :/"));
            const cmd = await checkCmd(inter, this,
                { overridePermissionsToChannel: channel.channel }
            );
            if (!cmd) return;
            inChannel = channel.channel;
        } else inChannel = this.channel;

        if (inChannel.messages.cache.size < 100) await inChannel.messages.fetch({ limit: 100 });

        let useCache = inChannel.messages.cache.filter(
            r => [false, undefined].includes(r.deleted) && (includePinned?.value === "1" ? true : r.pinned === false));

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
            if (/^\d{17,20}$/.test(toMessage.value)) {
                const compId = parseInt(toMessage.value);
                useCache = useCache.filter(r => parseInt(r.id, 10) > compId)
            } else return this.saveMessages(inter.reply("Invalid to-message argument. Provide message `Id` or `link` from the channel"));
        }

        this.filtered = [];

        if (filterUserIds) {
            const ids = filterUserIds.value.match(/\d{17,20}/g);
            if (ids?.length) {
                useCache = useCache.filter(r => ids.some(a => a === r.author?.id));
                if (!(filterContent || filterRegex || filterUser)) {
                    this.filtered = useCache.map(r => r);
                    if (this.noLenRet()) return;
                }
            }
        }

        if (filterUser) {
            useCache = useCache.filter(r => r.author?.id === filterUser.user.id);
            if (!(filterContent || filterRegex)) {
                this.filtered = useCache.map(r => r);
                if (this.noLenRet()) return;
            }
        }

        if (filterContent) {
            const nOT = filterContent.value[0] === "!";
            const re = new RegExp(escapeRegExp(nOT ? filterContent.value.slice(1) : filterContent.value), "i");
            for (const [k, v] of useCache)
                if (nOT ? !re.test(v.content) : re.test(v.content))
                    if (this.filtered.find(r => r.id === v.id)) continue;
                    else this.filtered.push(v);
        }

        if (filterRegex) {
            const source = filterRegex.value.split("/");
            const nOT = source[0] === "!";
            const re = new RegExp(source[1], source[2] || "");
            for (const [k, v] of useCache)
                if (nOT ? !re.test(v.content) : re.test(v.content))
                    if (this.filtered.find(r => r.id === v.id)) continue;
                    else this.filtered.push(v);
        }

        if (filterUserIds
            || filterUser
            || filterContent
            || filterRegex
        ) {
            if (this.noLenRet()) return;
        } else if (
            toMessage
            || attachmentOnly
            || botOnly
            || webhookOnly
            || includePinned?.value !== "1"
        ) this.filtered = useCache.map(r => r);

        let del = amount?.value ?? this.filtered.length;

        const deleted = await inChannel.bulkDelete(
            this.filtered.length
                ? this.filtered.reverse().slice(0, del > 100 ? 100 : del)
                : del, true);

        const ret = await inter.reply({
            content: "Purged `" + deleted.size + "` message"
                + (deleted.size > 1 ? "s" : "")
                + (del > 100
                    ? (
                        this.filtered.length > 100
                            ? "\nMatched " + this.filtered.length + " messages but c"
                            : "\nC"
                    ) + "an only purge up to 100 messages. Sorry :c" : ""),
            fetchReply: true
        });
        this.saveMessages(ret);
        logDev(deleted);
        return deleted;
    }

    noLenRet() {
        if (this.filtered.length) return false;
        this.interaction.reply("Your filter doesn't match any message");
        return true;
    }
}