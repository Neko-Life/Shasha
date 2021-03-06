"use strict";

const { MessageEmbed, MessageActionRow, MessageButton, ButtonInteraction } = require("discord.js");
const { wait, replyError, getColor, delUsMes, delMes, getChannelMessage, yesPrompt, copyProps } = require("../functions");
const { sanitizeUrl } = require("@braintree/sanitize-url");
const { DateTime } = require("luxon");
const { LUXON_TIMEZONES } = require("../constants");

const C_PAYLOAD = {
    title: {
        content: "Title:",
        components: [
            new MessageActionRow().addComponents([
                new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/set/title/title").setLabel("Set Title"),
                new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/set/title/url").setLabel("Set URL"),
                new MessageButton().setStyle("DANGER").setCustomId("embedConstruct/remove/title/title").setLabel("Remove Title"),
                new MessageButton().setStyle("DANGER").setCustomId("embedConstruct/remove/title/url").setLabel("Remove URL"),
            ])
        ]
    },
    desc: {
        content: "Description:",
        components: [
            new MessageActionRow().addComponents([
                new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/set/desc/desc").setLabel("Set"),
                new MessageButton().setStyle("DANGER").setCustomId("embedConstruct/remove/desc/desc").setLabel("Clear"),
            ])
        ]
    },
    author: {
        content: "Author:",
        components: [
            new MessageActionRow().addComponents([
                new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/set/author/authorName").setLabel("Set Name"),
                new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/set/author/authorIcon").setLabel("Set Icon"),
                new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/set/author/authorURL").setLabel("Set URL"),
            ]),
            new MessageActionRow().addComponents([
                new MessageButton().setStyle("DANGER").setCustomId("embedConstruct/remove/author/authorName").setLabel("Remove Name"),
                new MessageButton().setStyle("DANGER").setCustomId("embedConstruct/remove/author/authorIcon").setLabel("Remove Icon"),
                new MessageButton().setStyle("DANGER").setCustomId("embedConstruct/remove/author/authorURL").setLabel("Remove URL"),
            ]),
        ]
    },
    image: {
        content: "Image:",
        components: [
            new MessageActionRow().addComponents([
                new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/set/image/image").setLabel("Set Image"),
                new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/set/image/thumb").setLabel("Set Thumbnail"),
                new MessageButton().setStyle("DANGER").setCustomId("embedConstruct/remove/image/image").setLabel("Remove Image"),
                new MessageButton().setStyle("DANGER").setCustomId("embedConstruct/remove/image/thumb").setLabel("Remove Thumbnail"),
            ])
        ]
    },
    color: {
        content: "Color:",
        components: [
            new MessageActionRow().addComponents([
                new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/set/color/color").setLabel("Set"),
                new MessageButton().setStyle("DANGER").setCustomId("embedConstruct/remove/color/color").setLabel("Remove"),
            ])
        ]
    },
    field: {
        content: "Field:",
        components: [
            new MessageActionRow().addComponents([
                new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/set/field/field").setLabel("Add"),
                new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/set/field/field/slip").setLabel("Slip"),
                new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/set/field/fieldEd").setLabel("Edit"),
                new MessageButton().setStyle("DANGER").setCustomId("embedConstruct/remove/field/field").setLabel("Remove"),
            ])
        ]
    },
    footer: {
        content: "Footer:",
        components: [
            new MessageActionRow().addComponents([
                new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/set/footer/footerText").setLabel("Set Text"),
                new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/set/footer/footerIcon").setLabel("Set Icon"),
                new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/set/footer/footerTime").setLabel("Set Timestamp"),
            ]),
            new MessageActionRow().addComponents([
                new MessageButton().setStyle("DANGER").setCustomId("embedConstruct/remove/footerText").setLabel("Remove Text"),
                new MessageButton().setStyle("DANGER").setCustomId("embedConstruct/remove/footerIcon").setLabel("Remove Icon"),
                new MessageButton().setStyle("DANGER").setCustomId("embedConstruct/remove/footerTime").setLabel("Remove Timestamp"),
            ]),
        ]
    },
};

for (const k in C_PAYLOAD) {
    C_PAYLOAD[k].components.push(
        new MessageActionRow().addComponents(
            [
                new MessageButton().setStyle("SUCCESS").setCustomId("embedConstruct/startPage").setLabel("Done"),
            ]
        )
    );
}

const startPage = {
    content: "Configure your new embed:",
    components: [
        new MessageActionRow().addComponents([
            new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/handle/title").setLabel("Title"),
            new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/handle/desc").setLabel("Description"),
            new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/handle/author").setLabel("Author"),
            new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/handle/image").setLabel("Image"),
        ]),
        new MessageActionRow().addComponents([
            new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/handle/color").setLabel("Color"),
            new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/handle/field").setLabel("Field"),
            new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/handle/footer").setLabel("Footer"),
        ]),
        new MessageActionRow().addComponents([
            new MessageButton().setStyle("SECONDARY").setCustomId("embedConstruct/json").setLabel("Use JSON"),
            new MessageButton().setStyle("SECONDARY").setCustomId("embedConstruct/copy").setLabel("Copy from message"),
        ]),
        new MessageActionRow().addComponents([
            new MessageButton().setStyle("SUCCESS").setCustomId("embedConstruct/fin").setLabel("Finish"),
        ]),
    ]
};

class EmbedConstructor {
    constructor(interaction) {
        /** @type {import("../classes/ShaClient")} */
        this.client = interaction.client;
        /** @type {import("../typins").ShaButtonInteraction} */
        this.interaction = interaction;
        /** @type {MessageEmbed} */
        this.embed = null;
        /** @type {import("../typins").ShaMessage} */
        this.preview = interaction.message;
        /** @type {boolean} */
        this.returnEmbed = null;
        /** @type {boolean} */
        this.done = null;
        /** @type {boolean} */
        this.blockButton = null;
    }

    async start(returnEmbed, edit) {
        if (edit) {
            this.interaction.deferUpdate();
            this.message = this.interaction.message;
            await this.message.edit({ content: "Provide message link which contain embed to edit:", components: [] });
            const getM = await this.message.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === this.interaction.user.id && r.content?.length })
            const gMes = getM?.first();
            if (!gMes) return;
            delUsMes(gMes, 0);

            this.preview = await getChannelMessage(this.interaction, gMes.content);
            if (!this.preview) {
                return this.message.edit("Unknown message, is it in the galaxy or somethin?");
            } else if (this.preview.author.id !== this.client.user.id) {
                return this.message.edit("I can't edit embed that's not mine :<");
            } else if (!this.preview.embeds?.length) {
                return this.message.edit("That message has no embed in it smh");
            }
            if (this.preview.embeds?.length > 1) {
                await this.message.edit("Seems like this message has a few embed, provide embed position number to edit:");

                const getR = await this.message.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === this.interaction.user.id && r.content?.length && !/\D/.test(r.content) });
                const rMes = getR?.first();
                if (!rMes) return;
                delUsMes(rMes, 0);

                const num = parseInt(rMes.content, 10);
                if (num < 0 || num > this.preview.embeds.length) {
                    return this.message.edit("There's no embed in that position. Try again");
                }
                this.editIndex = num - 1;
            } else {
                this.editIndex = 0;
            }
            this.embed = this.preview.embeds[this.editIndex];
            this.startPage();
        } else {
            this.embed = new MessageEmbed().setDescription("`[EMPTY]`");
            this.preview.edit({ content: null, embeds: [this.embed], components: [] });
            this.message = await this.interaction.reply({ ...startPage, fetchReply: true });
            this.editIndex = 0;
        }

        this.channel = this.interaction.channel;
        this.message.interaction = this.interaction;
        this.message.embedConstruct = this;

        if (returnEmbed !== true) return this;
        this.returnEmbed = true;
        this.done = false;
        while (this.done === false) { await wait(1000) };
        return this.embed;
    }

    async updatePreview() {
        this.embed = this.client.finalizeEmbed(this.embed, true);
        const newMes = copyProps(this.preview, ["stickers", "nonce"], { writable: true, enumerable: true, configurable: true });
        if (newMes.content === "") newMes.content = null;
        newMes.embeds[this.editIndex] = this.embed;
        return this.preview.edit(newMes);
    }

    async startPage(inter) {
        if (inter instanceof ButtonInteraction && !(inter.deferred || inter.replied))
            inter.deferUpdate();
        if (this.blockButton) return;
        return this.message.edit(startPage);
    }

    async json(inter, args) {
        if (this.blockButton) return inter.deferUpdate();
        this.blockButton = true;
        const arg1 = args[1];
        const retOri = {};

        let prompt = await inter.reply({ content: "Provide JSON embed to use:", fetchReply: true });
        let usMes;
        try {
            const get = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content?.length });
            const repMes = get?.first();
            if (!repMes) return;
            usMes = repMes;

            const json = JSON.parse(repMes.content);
            this.embed = new MessageEmbed(json);

            this.startPage(inter);
            await this.updatePreview();
        } catch (e) {
            prompt = await this.handleEmbedConfError(e, inter, retOri);
        }
        if (prompt)
            delMes(prompt, usMes, 0);
        this.blockButton = false;
    }

    async copy(inter, args) {
        if (this.blockButton) return inter.deferUpdate();
        this.blockButton = true;
        const arg1 = args[1];
        const retOri = {};

        let prompt = await inter.reply({ content: "Provide message link containing the embed to copy:", fetchReply: true });
        let usMes;
        try {
            const get = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content?.length });
            const repMes = get?.first();
            if (!repMes) return;
            usMes = repMes;

            const tarMes = await getChannelMessage(inter, repMes.content);
            if (!tarMes) {
                await prompt.edit("Message unfound, go find some new message");
                await wait(5000);
            } else if (!tarMes.embeds?.length) {
                await prompt.edit("There's no embed in that message >:(");
                await wait(5000);
            }
            if (tarMes?.embeds.length > 1) {
                delUsMes(usMes, 0);
                await prompt.edit("Seems like this message has a few embed, provide embed position number to copy:");
                const getR = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length && !/\D/.test(r.content) });
                const theR = getR?.first();
                if (!theR) return;
                usMes = theR;

                const theN = parseInt(theR.content);
                if (theN < 1 || theN > tarMes.embeds.length) {
                    await prompt.edit("No embed in that position. Try again");
                    await wait(5000);
                } else {
                    this.embed = tarMes.embeds[theN - 1];
                }
            } else this.embed = tarMes.embeds[0];

            this.startPage(inter);
            await this.updatePreview();
        } catch (e) {
            prompt = await this.handleEmbedConfError(e, inter, retOri);
        }
        if (prompt)
            delMes(prompt, usMes, 0);
        this.blockButton = false;
    }

    async fin(inter) {
        if (this.blockButton) return inter.deferUpdate();
        if (this.returnEmbed)
            this.done = true;
        this.message.delete();
    }

    async handle(inter, args) {
        inter.deferUpdate();
        if (this.blockButton) return;
        await inter.message.edit(C_PAYLOAD[args[0]]);
    }

    async set(inter, args) {
        if (this.blockButton) return inter.deferUpdate();
        this.blockButton = true;
        const arg1 = args[1];
        const retOri = {};
        let prompt, usMes;
        try {
            if (arg1 === "title") {
                prompt = await inter.reply({ content: "Title to use:", fetchReply: true });
                const getM = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                const pMes = getM?.first();
                if (!pMes) return;
                usMes = pMes;

                retOri.setTitle = [this.embed.title];
                this.embed.setTitle(pMes.content);
            } else if (arg1 === "url") {
                prompt = await inter.reply({ content: "URL to use:", fetchReply: true });
                const getM = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                const pMes = getM?.first();
                if (!pMes) return;
                usMes = pMes;

                retOri.setURL = [this.embed.url];
                this.embed.setURL(sanitizeUrl(pMes.content));
            } else if (arg1 === "desc") {
                prompt = await inter.reply({ content: "Provide description:", fetchReply: true });
                const getM = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                const pMes = getM?.first();
                if (!pMes) return;
                usMes = pMes;

                retOri.setDescription = [this.embed.description];
                this.embed.setDescription(pMes.content);
            } else if (arg1 === "authorName") {
                prompt = await inter.reply({ content: "Set author name as:", fetchReply: true });
                const getM = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                const pMes = getM?.first();
                if (!pMes) return;
                usMes = pMes;

                retOri.author = { ...(this.embed.author || {}) };
                if (!this.embed.author) this.embed.author = {};
                this.embed.author.name = pMes.content;
            } else if (arg1 === "authorIcon") {
                prompt = await inter.reply({ content: "Set author icon:", fetchReply: true });
                const getM = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                const pMes = getM?.first();
                if (!pMes) return;
                usMes = pMes;

                retOri.author = { ...(this.embed.author || {}) };
                if (!this.embed.author) this.embed.author = {};
                this.embed.author.iconURL = sanitizeUrl(pMes.content);
            } else if (arg1 === "authorURL") {
                prompt = await inter.reply({ content: "Set author URL:", fetchReply: true });
                const getM = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                const pMes = getM?.first();
                if (!pMes) return;
                usMes = pMes;

                retOri.author = { ...(this.embed.author || {}) };
                if (!this.embed.author) this.embed.author = {};
                this.embed.author.url = sanitizeUrl(pMes.content);
            } else if (arg1 === "image") {
                prompt = await inter.reply({ content: "Provide image link:", fetchReply: true });
                const getM = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                const pMes = getM?.first();
                if (!pMes) return;
                usMes = pMes;

                retOri.image = { ...(this.embed.image || {}) };
                this.embed.setImage(sanitizeUrl(pMes.content));
            } else if (arg1 === "thumb") {
                prompt = await inter.reply({ content: "Provide thumbnail link:", fetchReply: true });
                const getM = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                const pMes = getM?.first();
                if (!pMes) return;
                usMes = pMes;

                retOri.thumbnail = this.embed.thumbnail;
                this.embed.setThumbnail(sanitizeUrl(pMes.content));
            } else if (arg1 === "color") {
                prompt = await inter.reply({ content: "Set color:", fetchReply: true });
                const getM = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                const pMes = getM?.first();
                if (!pMes) return;
                usMes = pMes;

                retOri.setColor = [this.embed.color];
                this.embed.setColor(getColor(pMes.content, true));
            } else if (arg1 === "field") {
                if (this.embed.fields.length > 24) {
                    prompt = await ((inter.deferred || inter.replied) ? inter.editReply : inter.reply).apply(inter, [{ content: "Maximum amount of field reached! Remove or edit some field instead", fetchReply: true }]);
                    await wait(5000);
                } else {
                    prompt = await ((inter.deferred || inter.replied) ? inter.editReply : inter.reply).apply(inter, [{ content: "Field name:", fetchReply: true }]);
                    const getM = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                    const pMes = getM?.first();
                    if (!pMes) return;
                    delUsMes(pMes, 0);

                    const data = {
                        name: pMes.content,
                        value: null,
                        inline: false,
                    };

                    await prompt.edit("Description:");
                    const getD = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                    const dMes = getD?.first();
                    if (!dMes) return;
                    delUsMes(dMes, 0);

                    data.value = dMes.content;

                    await prompt.edit("Do you want this field to be inline?");
                    const getI = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                    const iMes = getI?.first();
                    if (!iMes) return;
                    usMes = iMes;

                    data.inline = yesPrompt(iMes.content);

                    retOri.spliceFields = [() => this.embed.fields.findIndex(r => r.name === data.name && r.value === data.value && r.inline === data.inline), 1];
                    if (args[2] === "edit")
                        return this.embed.spliceFields(args[3], 1, data);
                    else if (args[2] === "slip") {
                        delUsMes(iMes, 0);
                        await prompt.edit("Provide position number to slip this field into the embed:");
                        const getU = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length && !/\D/.test(r.content) });
                        const uMes = getU?.first();
                        if (!uMes) return;
                        usMes = uMes;

                        const num = parseInt(uMes.content, 10);
                        this.embed.fields.splice(num - 1, 0, data);
                        this.embed.fields = this.embed.fields.filter(r => r);
                    } else this.embed.addField(data.name, data.value, data.inline);
                }
            } else if (arg1 === "fieldEd") {
                if (!this.embed.fields.length) {
                    prompt = await inter.reply({ content: "No field to edit, add some first", fetchReply: true });
                    await wait(5000);
                } else {
                    prompt = await inter.reply({ content: "Provide field position number to edit:", fetchReply: true });
                    const getM = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length && !/\D/.test(r.content) });
                    const pMes = getM?.first();
                    if (!pMes) return;

                    const num = parseInt(pMes.content, 10);
                    if (num < 1 || num > this.embed.fields.length) {
                        await prompt.edit("No field in that position! Try again");
                        await wait(5000);
                    } else {
                        this.blockButton = false;
                        await this.set(inter, ["field", "field", "edit", num - 1]);
                    }
                }
            } else if (arg1 === "footerText") {
                prompt = await inter.reply({ content: "Set footer text:", fetchReply: true });
                const getM = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                const pMes = getM?.first();
                if (!pMes) return;
                usMes = pMes;

                retOri.footer = { ...(this.embed.footer || {}) };
                if (!this.embed.footer) this.embed.footer = {};
                this.embed.footer.text = pMes.content;
            } else if (arg1 === "footerIcon") {
                prompt = await inter.reply({ content: "Set footer icon:", fetchReply: true });
                const getM = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                const pMes = getM?.first();
                if (!pMes) return;
                usMes = pMes;

                retOri.footer = { ...(this.embed.footer || {}) };
                if (!this.embed.footer) this.embed.footer = {};
                this.embed.footer.iconURL = sanitizeUrl(pMes.content);
            } else if (arg1 === "footerTime") {
                prompt = await inter.reply({ content: "Set timestamp:", fetchReply: true });
                const getM = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                const pMes = getM?.first();
                if (!pMes) return;

                retOri.timestamp = this.embed.timestamp;
                let ts;
                if (!/\D/.test(pMes.content)) {
                    ts = DateTime.fromMillis(parseInt(pMes.content));
                } else {
                    ts = DateTime.fromFormat(pMes.content, `DDD ${/(?:am|pm)$/i.test(pMes.content) ? "tt" : "TT"}`);
                }
                if (!ts.isValid) {
                    await prompt.edit(replyError({ message: "Invalid time value" }));
                    await wait(10000);
                } else {
                    delUsMes(pMes, 0);
                    await prompt.edit("Set the timezone (<Continent/City> format, find your city** [here](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)**) of the timestamp:");
                    const getT = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                    const tMes = getT?.first();
                    if (!tMes) return;
                    usMes = tMes;

                    let tz = LUXON_TIMEZONES.find(r => r.toLowerCase() === tMes.content.toLowerCase());
                    if (!tz) {
                        if (ts.setZone(tMes.content).isValid) tz = tMes.content;
                        else {
                            await prompt.edit("No Continent/City with that name in timezone database, falling back to UTC");
                            tz = "utc";
                            await wait(5000);
                        }
                    }
                    ts = ts.setZone(tz).toJSDate();
                    this.embed.setTimestamp(ts);
                }
            }

            this.message.edit(C_PAYLOAD[args[0]]);
            await this.updatePreview();
        } catch (e) {
            prompt = await this.handleEmbedConfError(e, inter, retOri);
        }
        if (prompt)
            delMes(prompt, usMes, 0);
        this.blockButton = false;
    }

    async remove(inter, args) {
        if (this.blockButton) return inter.deferUpdate();
        this.blockButton = true;
        const arg1 = args[1];
        const retOri = {};
        let prompt, usMes;
        try {
            if (arg1 === "title") {
                retOri.title = this.embed.title;
                this.embed.title = null;
            } else if (arg1 === "url") {
                this.embed.url = null;
            } else if (arg1 === "desc") {
                retOri.description = this.embed.description;
                this.embed.description = null;
            } else if (arg1 === "authorName") {
                retOri.author = { ...(this.embed.author || {}) };
                this.embed.author.name = null;
            } else if (arg1 === "authorIcon") {
                this.embed.author.iconURL = null;
            } else if (arg1 === "authorURL") {
                this.embed.author.url = null;
            } else if (arg1 === "image") {
                this.embed.image = null;
            } else if (arg1 === "thumb") {
                this.embed.thumbnail = null;
            } else if (arg1 === "color") {
                this.embed.color = null;
            } else if (arg1 === "field") {
                if (!this.embed.fields?.length) {
                    prompt = await inter.reply({ content: "No field to remove, add some first", fetchReply: true });
                    await wait(5000);
                } else {
                    prompt = await inter.reply({ content: "Provide field position number to remove:", fetchReply: true });
                    const getM = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length && !/\D/.test(r.content) });
                    const pMes = getM?.first();
                    if (!pMes) return;
                    usMes = pMes;

                    const num = parseInt(pMes.content, 10);
                    if (num < 1 || num > this.embed.fields.length) {
                        await prompt.edit("No field in that position! Try again");
                        await wait(5000);
                    } else {
                        this.embed.spliceFields(num - 1, 1);
                    }
                }
            } else if (arg1 === "footerText") {
                retOri.footer = { ...(this.embed.footer || {}) };
                this.embed.footer.text = null;
            } else if (arg1 === "footerIcon") {
                this.embed.footer.iconURL = null;
            } else if (arg1 === "footerTime") {
                this.embed.timestamp = null;
            }
            this.message.edit(C_PAYLOAD[args[0]]);
            await this.updatePreview();
        } catch (e) {
            prompt = await this.handleEmbedConfError(e, inter, retOri);
        }
        if (!(inter.replied || inter.deferred))
            inter.deferUpdate();
        if (prompt)
            delMes(prompt, usMes, 0);
        this.blockButton = false;
    }

    async handleEmbedConfError(e, inter, retOri) {
        const errMes = replyError(e);
        let ret;
        if (!(inter.replied || inter.deferred))
            ret = await inter.reply({ ...errMes, fetchReply: true });
        else ret = await inter.editReply(errMes);
        for (const k in retOri) {
            if (k === "spliceFields")
                this.embed[k](retOri[k][0](), retOri[k][1]);
            else if (typeof this.embed[k] === "function")
                this.embed[k](...retOri[k]);
            else this.embed[k] = retOri[k];
        }
        await wait(5000);
        return ret;
    }
}

module.exports = { EmbedConstructor }
