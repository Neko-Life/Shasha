'use strict';

const { ButtonInteraction, MessageActionRow, MessageButton, MessageSelectMenu } = require("discord.js");
const { ROW_BUTTON_STYLES } = require("../constants");
const { copyProps, replyError } = require("../functions");

const messageConstructButtons = [
    new MessageActionRow()
        .addComponents([
            new MessageButton().setCustomId("messageConstruct/add/button").setLabel("Add Button").setStyle("PRIMARY"),
            new MessageButton().setCustomId("messageConstruct/add/selectMenu").setLabel("Add Select Menu").setStyle("PRIMARY"),
            new MessageButton().setCustomId("messageConstruct/add/embed").setLabel("Add Embed").setStyle("PRIMARY"),
            new MessageButton().setCustomId("messageConstruct/set/content").setLabel("Set Text Content").setStyle("PRIMARY"),
            new MessageButton().setCustomId("messageConstruct/edit/content").setLabel("Edit Text Content").setStyle("PRIMARY"),
        ]),
    new MessageActionRow()
        .addComponents([
            new MessageButton().setCustomId("messageConstruct/edit/embed").setLabel("Edit Embed").setStyle("PRIMARY"),
            new MessageButton().setCustomId("messageConstruct/edit").setLabel("Edit Component").setStyle("PRIMARY"),
        ]),
    new MessageActionRow()
        .addComponents([
            new MessageButton().setCustomId("messageConstruct/remove/content").setLabel("Remove Text Content").setStyle("DANGER"),
            new MessageButton().setCustomId("messageConstruct/remove/embed").setLabel("Remove Embed").setStyle("DANGER"),
            new MessageButton().setCustomId("messageConstruct/remove").setLabel("Remove Component").setStyle("DANGER"),
            new MessageButton().setCustomId("messageConstruct/close").setLabel("Done").setStyle("SUCCESS"),
        ])
];

const startPage = { content: "Add some components to your message", components: messageConstructButtons };

class AddConstruct {
    /**
     * 
     * @param {import("../typins").ShaMessage} preview 
     * @param {import("../typins").ShaMessage} message 
     */
    static async button(inter, preview, message, args) {
        const id = new Date().valueOf().toString();
        const button = new MessageButton()
            .setCustomId(id)
            .setLabel("New Button")
            .setStyle("SECONDARY");
        let success;
        const newMes = copyProps(preview, ["stickers", "nonce"]);
        if (newMes.components[4]?.components.length === 5) success = false;
        else for (let i = 0; i < newMes.components.length + 1; i++) {
            if (!newMes.components[i]) newMes.components[i] = new MessageActionRow();
            if (newMes.components[i].components.length < 5) {
                newMes.components[i].addComponents(button);
                success = true;
                break;
            }
        }
        inter.deferUpdate();
        if (success === false) {
            const no = await message.channel.send("Slot full. Try remove some component");
            return delNo(no);
        } else if (success === true) {
            return preview.edit(newMes);
        } else {
            const no = await message.channel.send("Something went wrong. Contact support pls :(");
            return delNo(no);
        }
    }
}

class EditConstruct {
    /**
     * 
     * @param {import("../typins").ShaMessage} preview 
     * @param {import("../typins").ShaMessage} message 
     * @param {{row: number, index: number, found: import("discord.js").MessageComponent}} param2
     */
    static async BUTTON(inter, preview, message, { row, index, found, promptComponent }) {
        const components = [
            new MessageActionRow()
                .addComponents([
                    new MessageButton().setLabel("Set Label").setStyle("PRIMARY").setCustomId(`label`),
                    new MessageButton().setLabel("Set Emoji").setStyle("PRIMARY").setCustomId(`emote`),
                    new MessageButton().setLabel("Set Style").setStyle("PRIMARY").setCustomId(`style`),
                    new MessageButton().setLabel("Actions").setStyle("PRIMARY").setCustomId(`actions`),
                ]),
            new MessageActionRow()
                .addComponents(
                    new MessageButton().setLabel("Done").setStyle("SUCCESS").setCustomId(`messageConstruct/startPage`),
                ),
        ]
        message.edit({ content: `Edit button **${found.label}**`, components });
        const start = async () => {
            const collectEdit = await promptComponent.message.awaitMessageComponent({
                filter: (r) =>
                    r.user.id === inter.user.id
            });
            if (collectEdit.customId === "label") {
                const prompt = await collectEdit.reply({ content: "New label:", fetchReply: true });
                const collect = await prompt.channel.awaitMessages({ filter: (r) => r.author.id === inter.user.id, max: 1 });
                const got = collect.first();
                if (got.content.length > 80) {
                    prompt.edit("Label can't be longer than 80 characters. Try again");
                    delNo(prompt, undefined, got);
                    return start();
                }
                delNo(prompt, 0, got);

                const newMes = copyProps(preview, ["stickers", "nonce"]);
                newMes.components[row].components[index].setLabel(got.content);
                preview.edit(newMes);
                message.edit({ content: `Edit button **${got.content}**`, components });
                return start();
            } else if (collectEdit.customId === "emote") {
                const prompt = await collectEdit.reply({ content: "Set emoji:", fetchReply: true });
                const collect = await prompt.channel.awaitMessages({ filter: (r) => r.author.id === inter.user.id, max: 1 });
                const got = collect.first();

                const newMes = copyProps(preview, ["stickers", "nonce"]);
                newMes.components[row].components[index].setEmoji(got.content);
                try {
                    await preview.edit(newMes);
                } catch (e) {
                    if (/Invalid emoji/.test(e.message)) {
                        prompt.edit("Invalid emoji. Provide emoji that you have access to");
                    } else {
                        prompt.edit(replyError(e));
                    }
                    delNo(prompt, undefined, got);
                    return start();
                }
                delNo(prompt, 0, got);
                return start();
            } else if (collectEdit.customId === "style") {
                const prompt = await collectEdit.reply({ content: "Pick a button style:", components: [ROW_BUTTON_STYLES], fetchReply: true });
                const collect = await prompt.awaitMessageComponent({ filter: (r) => r.user.id === inter.user.id });

                const newMes = copyProps(preview, ["stickers", "nonce"]);
                newMes.components[row].components[index].setStyle(collect.customId);
                if (collect.customId === "LINK") {
                    delete newMes.components[row].components[index].customId;
                    prompt.edit({ content: "An URL is required for this style, provide URL:", components: [] });
                    const collectLink = await prompt.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id });
                    const gotLink = collectLink.first();
                    try {
                        newMes.components[row].components[index].setURL(gotLink.content);
                        await preview.edit(newMes);
                    } catch (e) {
                        if (/Scheme must be one of/.test(e.message))
                            prompt.edit("Invalid URL. Try again");
                        else prompt.edit(replyError(e));
                        delNo(prompt, undefined, gotLink);
                        return start();
                    }
                    delNo(prompt, 0, gotLink);
                    return start();
                } else {
                    if (!newMes.components[row].components[index].customId) {
                        delete newMes.components[row].components[index].url;
                        newMes.components[row].components[index].setCustomId(new Date().valueOf().toString());
                    }
                    delNo(prompt, 0);
                    preview.edit(newMes);
                    return start();
                }
            }
        }
        start();
        console;

        // if (!args?.length) {
        //     const buttons = [];
        //     for (const K of preview.components)
        //         for (const I of K.components) {
        //             if (I.type !== "BUTTON") continue;
        //             const newB = copyProps(I, [], { writable: true });
        //             buttons.push(newB.setCustomId(`messageConstruct/edit/button/${newB.customId}`));
        //         }
        //     const rows = [];
        //     let row = new MessageActionRow();
        //     if (!buttons.length) {
        //     } else for (let i = 0; i < buttons.length; i++) {
        //         row.addComponents(buttons[i]);
        //         if (row.components.length === 5 || !buttons[i + 1]) {
        //             rows.push(row);
        //             row = new MessageActionRow();
        //         }
        //     }
        //     return message.edit({ content: "Which button you wanna edit?", components: rows });
        // }
        /** type {MessageButton} */
        // let find, row = -1, column;
        // for (const K of preview.components) {
        //     row++;
        //     column = -1;
        //     for (const I of K.components) {
        //         column++;
        //         if (I.customId !== args[0]) continue;
        //         else {
        //             find = I;
        //             break;
        //         }
        //     }
        //     if (find) break;
        // }
        // const newButton = copyProps(find, [], { writable: true });

        // const selectMenu = new MessageActionRow()
        //     .addComponents(
        //         new MessageSelectMenu()
        //             .setCustomId("messageConstruct")
        //             .setMaxValues(1)
        //             .setOptions([
        //                 {

        //                 }
        //             ])
        //     )

        // const newPrev = copyProps(preview, ["stickers", "nonce"]);
        // console;
        return;
    }
}

class MessageConstruct {
    /**
     * 
     * @param {ButtonInteraction} interaction 
     */
    constructor(interaction) {
        this.client = interaction.client;
        this.message = null;
        this.preview = interaction.message;
        this.guild = interaction.guild || null;
        this.channel = interaction.channel;
        this.member = interaction.member;
        this.user = interaction.user;
        this.pages = [];
        this.interaction = interaction;
    }

    async start() {
        await this.preview.edit({ content: "`[EMPTY]`", components: [] });
        this.message = await this.interaction.reply({ ...startPage, fetchReply: true });
        this.message.interaction = this.interaction;
        return this.message.messageConstruct = this;
    }

    async add(inter, args) {
        AddConstruct[args[0]](inter, this.preview, this.message, args.slice(1));
    }

    async edit(inter, args) {
        if (!this.preview.components.length) {
            const no = await inter.reply({ content: "Add some component first to edit it", fetchReply: true });
            return delNo(no);
        }
        inter.deferUpdate();
        const prompt = await this.message.edit({ content: "Which component you want to edit?", components: this.preview.components, fetchReply: true });
        const promptComponent = await prompt.awaitMessageComponent({ filter: (r) => r.user.id === this.user.id });

        let row = -1, index = -1, found;
        for (let iRow = 0; iRow < this.preview.components.length; iRow++) {
            row = iRow;
            const len = this.preview.components[iRow];
            if (!len.components.length) continue;
            for (let iC = 0; iC < len.components.length; iC++) {
                index = iC;
                if (len.components[iC].customId !== promptComponent.customId) continue;
                found = len.components[iC];
                break;
            }
            if (found) break;
        }
        promptComponent.deferUpdate();

        EditConstruct[found.type](inter, this.preview, this.message, { row, index, found, promptComponent });
    }

    async remove(inter, args) {
        RemoveConstruct[args[0]](inter, this.preview, this.message, args.slice(1));
    }

    async startPage(inter) {
        inter.deferUpdate();
        this.message.edit(startPage);
    }

    async close(inter) {
        if (this.preview.content === "`[EMPTY]`") {
            const rem = copyProps(this.preview, ["stickers", "nonce"], { enumerable: true, writable: true });
            rem.content = null;
            this.preview.edit(rem);
        }
        inter.message.delete();
        delete this;
    }
}

module.exports = { MessageConstruct }

function delNo(msg, timeout = 10000, ...userMsgs) {
    setTimeout(
        () => {
            if (userMsgs[0]) {
                if (userMsgs[0].channel.permissionsFor(userMsgs[0].client.user).has("MANAGE_MESSAGES")) {
                    const toPurge = [...userMsgs];
                    (msg && !msg.deleted) ? toPurge.push(msg) : null;
                    return userMsgs[0].channel.bulkDelete(toPurge);
                }
            }
            if (msg?.deleted || !msg.deletable) return;
            msg.delete();
        }, timeout
    );
    return msg;
}