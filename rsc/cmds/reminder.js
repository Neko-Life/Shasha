"use strict";

const { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const { DateTime } = require("luxon");
const { Command } = require("../classes/Command");
const { ShaBaseDb } = require("../classes/Database");
const { Moderation } = require("../classes/Moderation");
const { LUXON_TIMEZONES, SCHEDULE_MESSAGER_PATH } = require("../constants");
const { logDev } = require("../debug");
const { replyError, unixToSeconds, tickTag, getColor, prevNextButton, delMes } = require("../functions");
const { createInterval, intervalToStrings } = require("../util/Duration");

module.exports.remind = class RemindCmd extends Command {
    constructor(interaction) {
        const tz = {};
        for (const k of LUXON_TIMEZONES)
            tz[k] = k;
        super(interaction, {
            name: "remind",
            autocomplete: {
                commands: {
                    timezone: tz
                }
            },
            deleteSavedMessagesAfter: 10000,
        });
    }
    /**
     * 
     * @param {import("../typins").ShaCommandInteraction} inter 
     * @param {*} param1 
     * @returns 
     */
    async run(inter, { about, at, timezone = { value: "utc" }, channel } = {}) {
        const startDate = new Date();
        const durArg = at.value.slice(2).trim();
        let endDate;
        let interval;
        let durationString;
        if (/^\d/.test(durArg)) {
            try {
                const parsed = Moderation.defaultParseDuration(startDate, durArg);
                endDate = parsed.end;
                interval = parsed.interval;
                durationString = parsed.duration;
            } catch (e) {
                return inter.reply(replyError(e));
            }
        } else try {
            endDate = DateTime.fromFormat(at.value, `DDD ${/(?:am|pm)$/i.test(at.value) ? "tt" : "TT"}`).setZone(timezone.value).toJSDate();
            interval = createInterval(startDate, endDate);
            durationString = intervalToStrings(interval);
        } catch (e) {
            return inter.reply(replyError(e));
        }
        if (interval.invalidReason === "end before start")
            return inter.reply("Aww someone wanna get nostalgic uwu so sweett but sorry i can't remind you at that time, the past has passed just move on already");
        if ((durationString.ms || 0) < 10000)
            return inter.reply(replyError({ message: "Duration less than minimum ms" }));

        if (!(endDate instanceof Date))
            throw new TypeError("endDate isn't Date: " + typeof endDate + " " + endDate.prototype?.name);

        await inter.deferReply();

        /**
         * 
         * @type {import("../classes/Actions").RemindActionData}
         */
        const data = {
            about: about.value,
            action: "remind",
            user: this.user.id,
        };
        if (channel)
            data.channel = channel.channel.id;

        const job = {
            name: `reminder/${this.user.id}/${startDate.valueOf()}`,
            path: SCHEDULE_MESSAGER_PATH,
            date: endDate,
            type: "reminder",
            worker: {
                workerData: data
            },
        }
        logDev(await this.client.scheduler.add(job));
        return inter.editReply(`Okie! I will remind you about it in ${durationString.strings.join(" ")} at <t:${unixToSeconds(endDate)}:F>! You can view all your reminder with \`/reminder manage\``);
    }
}

module.exports.manage = class ManageReminderCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "manage-reminder",
        });
    }
    /**
     * 
     * @param {import("../typins").ShaCommandInteraction} inter 
     * @param {{user:import("../typins").ShaUser}} param1 
     * @returns 
     */
    async run(inter, { user }) {
        await inter.deferReply();

        /** @type {import("../typins").ShaGuildMember} */
        let member, noRemove;
        if (user) {
            user = user.user;
            member = user.member;
            noRemove = true;
        } else {
            user = this.user;
            member = this.member;
        }

        const db = new ShaBaseDb(this.client.db.db, "reminder");

        let reminder;
        const getReminder = async () => {
            const get = await db.get("reminder") || [];
            reminder = new Array(...get).filter(r => r[0].startsWith(`reminder/${user.id}/`)).map(r => r[1].value);
        }

        await getReminder();

        const retNoReminder = (interOrMsg) => {
            if (reminder.length) return;
            (interOrMsg.editReply || interOrMsg.edit).apply(interOrMsg, [{ content: "Seems like you're good! Create new reminder with `/reminder remind`", embeds: [], components: [] }]);
            return true;
        }

        if (retNoReminder(inter)) return;

        const baseEmb = new MessageEmbed()
            .setAuthor({ name: tickTag(member || user, true), iconURL: (member || user).displayAvatarURL({ format: "png", size: 4096, dynamic: true }) })
            .setTitle("Reminder")
            .setColor(getColor(user.accentColor, true, member?.displayColor));

        let embs;

        const createEmbeds = () => {
            embs = [];
            let nEmb = new MessageEmbed(baseEmb);

            let num = 1;
            for (const D of reminder) {
                if (nEmb === null) nEmb = new MessageEmbed(baseEmb);
                const at = unixToSeconds(D.date);
                const desc = `**On**: <t:${at}:F> (<t:${at}:R>)\n`
                    + `**About**: ${D.worker.workerData.about}`;
                nEmb.addField(`\`${num++}#\``, desc);
                if (nEmb?.fields.length === 10) {
                    embs.push(nEmb);
                    nEmb = null;
                }
            };
            if (nEmb !== null) embs.push(nEmb);
        }

        createEmbeds();

        const rmB = new MessageActionRow().addComponents([
            new MessageButton().setCustomId("rm").setLabel("Remove").setStyle("SECONDARY"),
            new MessageButton().setCustomId("rmA").setLabel("Clear").setStyle("DANGER"),
        ]);

        const pNB = prevNextButton(true);

        let pages;
        const createPages = () => {
            const components = embs.length > 1 ? [pNB] : [];
            if (!noRemove) components.push(rmB);
            pages = embs.map(r => {
                return { embeds: [r], components };
            });
        };

        createPages();

        const createMessageInteraction = async (mesId, curPage) => {
            await this.client.createMessageInteraction(mesId, { CURRENT_PAGE: curPage, PAGES: pages });
        };

        /** @type {import("../typins").ShaMessage} */
        const msg = await inter.editReply(pages[0]);

        await createMessageInteraction(msg.id, 0);

        const updateMessage = async () => {
            await getReminder();
            if (retNoReminder(msg)) return;
            createEmbeds();
            createPages();
            let curPage = this.client.activeMessageInteractions.get(msg.id).CURRENT_PAGE;
            if (!pages[curPage]) curPage = pages.length - 1;
            await createMessageInteraction(msg.id, curPage);
            msg.edit(pages[curPage]);
            return true;
        }

        const buttonHandler = async () => {
            const rp = await msg.awaitMessageComponent({ filter: (r) => r.user.id === this.user.id });
            if (!rp) return;
            if (rp.customId === "rm") {
                const prompt = await rp.reply({ content: "Provide reminder number to remove:", fetchReply: true });
                const getP = await this.channel.awaitMessages({ max: 1, filter: (r) => r.content?.length && !/\D/.test(r.content) && r.author.id === this.user.id });
                const mesP = getP?.first();
                if (!mesP) return;
                const numP = parseInt(mesP.content, 10);
                if (numP < 1 || numP > reminder.length) {
                    prompt.edit("ERROR: RANGE (no reminder with that number!)");
                    delMes(prompt, mesP, 10000);
                    return buttonHandler();
                }
                delMes(prompt, mesP, 0);
                try { await this.client.scheduler.remove(reminder[numP - 1].name); }
                catch (e) { logDev(e); };
                if (!await updateMessage()) return;
            } else if (rp.customId === "rmA") {
                const prompt = await rp.reply({ content: "Are you sure you wanna remove **all** your reminder? Reply with `yes` to proceed:", fetchReply: true });
                const getP = await this.channel.awaitMessages({ max: 1, filter: (r) => r.content?.length && r.author.id === this.user.id });
                const mesP = getP?.first();
                if (!mesP) return;
                if (mesP.content === "yes") {
                    delMes(prompt, mesP, 0);
                    for (const R of reminder) {
                        try { await this.client.scheduler.remove(R.name); }
                        catch (e) { logDev(e); };
                    }
                    if (!await updateMessage()) return;
                } else {
                    prompt.edit("Cancelled");
                    delMes(prompt, mesP);
                }
            }
            buttonHandler();
        }

        buttonHandler();
        msg.buttonHandler = buttonHandler;
        return msg;
    }
}

/**
 * Parse time with format
 * 
 * @param {string} at 
 * @param {string} timezone 
 * 
 * @returns {{endDate: Date, interval: luxon.Interval, durationString:{
 *   object: luxon.DurationObject,
 *   strings: string[],
 *   ms: number,
 * }}}
 */
function parseTime(at, timezone) {
    const startDate = new Date();
    const durArg = at.slice(2).trim();
    let endDate, interval, durationString;
    if (/^\d/.test(durArg)) {
        const parsed = Moderation.defaultParseDuration(startDate, durArg);
        endDate = parsed.end;
        interval = parsed.interval;
        durationString = parsed.duration;
    } else {
        endDate = DateTime.fromFormat(at, `DDD ${/(?:am|pm)$/i.test(at) ? "tt" : "TT"}`).setZone(timezone).toJSDate();
        interval = createInterval(startDate, endDate);
        durationString = intervalToStrings(interval);
    }
    if (interval.invalidReason) throw new RangeError(interval.invalidReason);
    if ((durationString.ms || 0) < 10000)
        throw new RangeError("Duration less than minimum ms");

    if (!(endDate instanceof Date))
        throw new TypeError("endDate isn't Date: " + typeof endDate + " " + endDate.prototype?.name);
    return { endDate, interval, durationString };
}
