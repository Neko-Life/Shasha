"use strict";

const { MessageEmbed, MessageActionRow, MessageButton, ButtonInteraction } = require("discord.js");
const { wait, replyError, getColor, delUsMes, delMes } = require("../functions");
const { sanitizeUrl } = require("@braintree/sanitize-url");

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
            new MessageButton().setStyle("PRIMARY").setCustomId("embedConstruct/handle/thumb").setLabel("Thumbnail"),
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
    }

    async start(returnEmbed) {
        this.embed = new MessageEmbed().setDescription("`[EMPTY]`");
        this.preview.edit({ content: null, embeds: [this.embed], components: [] });
        this.message = await this.interaction.reply({ ...startPage, fetchReply: true });
        this.message.interaction = this.interaction;
        this.message.embedConstruct = this;
        if (returnEmbed !== true) return this;
        this.returnEmbed = true;
        this.done = false;
        while (this.done === false) { await wait(1000) };
        return this.embed;
    }

    async updatePreview() {
        return this.preview.edit({ embeds: [this.embed] });
    }

    async startPage(inter) {
        if (inter instanceof ButtonInteraction && !(inter.deferred || inter.replied))
            inter.deferUpdate();
        return this.message.edit(startPage);
    }

    async json(inter, args) {
        const prompt = inter.reply({ content: "", fetchReply: true });
        const get = await inter.channel.awaitMessages({ filter: (r) => r.author.id === inter.user.id && r.content?.length });
        const repMes = get?.first();
        if (!repMes) return;
    }
    async copy(inter, args) {
        const prompt = inter.reply({ content: "", fetchReply: true });
        const get = await inter.channel.awaitMessages({ filter: (r) => r.author.id === inter.user.id && r.content?.length });
        const repMes = get?.first();
        if (!repMes) return;
    }

    async fin() {
        if (this.returnEmbed)
            this.done = true;
        this.message.delete();
    }

    async handle(inter, args) {
        inter.deferUpdate();
        await inter.message.edit(C_PAYLOAD[args[0]]);
    }

    async set(inter, args) {
        if (this.blockSet) return inter.deferUpdate();
        this.blockSet = true;
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

                retOri.setTitle = this.embed.title;
                this.embed.setTitle(pMes.content);
            } else if (arg1 === "url") {
                prompt = await inter.reply({ content: "URL to use:", fetchReply: true });
                const getM = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                const pMes = getM?.first();
                if (!pMes) return;
                usMes = pMes;

                retOri.setURL = this.embed.url;
                this.embed.setURL(sanitizeUrl(pMes.content));
            } else if (arg1 === "desc") {
                prompt = await inter.reply({ content: "Provide description:", fetchReply: true });
                const getM = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                const pMes = getM?.first();
                if (!pMes) return;
                usMes = pMes;

                retOri.setDescription = this.embed.description;
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

                retOri.setImage = this.embed.image;
                this.embed.setImage(sanitizeUrl(pMes.content));
            } else if (arg1 === "thumb") {
                prompt = await inter.reply({ content: "Provide thumbnail link:", fetchReply: true });
                const getM = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                const pMes = getM?.first();
                if (!pMes) return;
                usMes = pMes;

                retOri.setThumbnail = this.embed.thumbnail;
                this.embed.setThumbnail(sanitizeUrl(pMes.content));
            } else if (arg1 === "color") {
                prompt = await inter.reply({ content: "Set color:", fetchReply: true });
                const getM = await inter.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id && r.content.length });
                const pMes = getM?.first();
                if (!pMes) return;
                usMes = pMes;

                retOri.setColor = this.embed.color;
                this.embed.setColor(getColor(pMes.content, true));
            } else if (arg1 === "field") {
                prompt = await inter.reply({ content: "Field name:", fetchReply: true });
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

                data.inline = iMes.content === "yes";

                this.embed.addField(data.name, data.value, data.inline);
                retOri.spliceFields = [this.embed.fields.length - 1 /* findIndex(r => r.name === data.name && r.value === data.value && r.inline === data.inline) */, 1];
            } else if (arg1 === "fieldEd") {





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
                usMes = pMes;

                retOri.setTimestamp = this.embed.timestamp;
                this.embed.setTimestamp(pMes.content);
            }
            this.message.edit(C_PAYLOAD[args[0]]);
            await this.updatePreview();
        } catch (e) {
            for (const k in retOri) {
                if (k === "spliceFields")
                    this.embed[k](...retOri[k]);
                else if (typeof this.embed[k] === "function") this.embed[k](retOri[k]);
                else this.embed[k] = retOri[k];
            }
            const errMes = replyError(e);
            if (!(inter.replied || inter.deferred))
                inter.reply(errMes);
            else inter.editReply(errMes);
            await wait(10000);
        }
        if (prompt)
            delMes(prompt, usMes, 0);
        this.blockSet = false;
    }

    async remove(inter, args) {
        if (this.blockRem) return inter.deferUpdate();
        this.blockRem = true;
        const arg1 = args[1];
        const retOri = {};
        let prompt;
        try {
            if (arg1 === "title") {
                this.embed.title = null;
            } else if (arg1 === "url") {
                this.embed.url = null;
            } else if (arg1 === "desc") {
                this.embed.description = null;
            } else if (arg1 === "authorName") {
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
                prompt = await inter.reply();
            } else if (arg1 === "footerText") {
                this.embed.footer.text = null;
            } else if (arg1 === "footerIcon") {
                this.embed.footer.iconURL = null;
            } else if (arg1 === "footerTime") {
                this.embed.timestamp = null;
            }
            this.message.edit(C_PAYLOAD[args[0]]);
            await this.updatePreview();
        } catch (e) {
            for (const k in retOri) {
                this.embed[k](retOri[k]);
            }
            const errMes = replyError(e);
            if (!(inter.replied || inter.deferred))
                inter.reply(errMes);
            else inter.editReply(errMes);
            await wait(10000);
        }
        if (!(inter.replied || inter.deferred))
            inter.deferUpdate();
        if (prompt)
            prompt.deleted ? null : prompt.delete();
        this.blockRem = false;
    }
}

module.exports = { EmbedConstructor }
