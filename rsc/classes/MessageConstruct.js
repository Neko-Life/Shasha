"use strict";

const { ButtonInteraction, MessageActionRow, MessageButton, MessageSelectMenu, MessageEmbed } = require("discord.js");
const { ROW_BUTTON_STYLES } = require("../constants");
const { loadDb } = require("../database");
const { copyProps, replyError, getColor, strYesNo, getChannelMessage } = require("../functions");
const { Actions } = require("./Actions");

const messageConstructButtons = [
    new MessageActionRow()
        .addComponents([
            new MessageButton().setCustomId("messageConstruct/add/button").setLabel("Add Button").setStyle("PRIMARY"),
            new MessageButton().setCustomId("messageConstruct/add/selectMenu").setLabel("Add Select Menu").setStyle("PRIMARY"),
            new MessageButton().setCustomId("messageConstruct/add/embed").setLabel("Add Embed").setStyle("PRIMARY"),
            new MessageButton().setCustomId("messageConstruct/set/content").setLabel("Set Text Content").setStyle("PRIMARY"),
        ]),
    new MessageActionRow()
        .addComponents([
            new MessageButton().setCustomId("messageConstruct/edit").setLabel("Edit Component").setStyle("PRIMARY"),
            new MessageButton().setCustomId("messageConstruct/edit/embed").setLabel("Edit Embed").setStyle("PRIMARY"),
        ]),
    new MessageActionRow()
        .addComponents([
            new MessageButton().setCustomId("messageConstruct/remove").setLabel("Remove Component").setStyle("DANGER"),
            new MessageButton().setCustomId("messageConstruct/remove/embed").setLabel("Remove Embed").setStyle("DANGER"),
            new MessageButton().setCustomId("messageConstruct/remove/content").setLabel("Remove Text Content").setStyle("DANGER"),
            new MessageButton().setCustomId("messageConstruct/close").setLabel("Done").setStyle("SUCCESS"),
        ])
];

const startPage = { content: "Add some components to your message", components: messageConstructButtons, embeds: [] };

const settingActionsButtons = new MessageActionRow()
    .addComponents([
        new MessageButton().setCustomId("add").setStyle("PRIMARY").setLabel("Add"),
        new MessageButton().setCustomId("edit").setStyle("PRIMARY").setLabel("Edit"),
        new MessageButton().setCustomId("remove").setStyle("DANGER").setLabel("Remove"),
        new MessageButton().setCustomId("done").setStyle("SUCCESS").setLabel("Done"),
    ]);

class AddConstruct {
    /**
     * 
     * @param {import("../typins").ShaMessage} preview 
     * @param {import("../typins").ShaMessage} message 
     */
    static async button(inter, preview, message, args) {
        const id = "action:" + new Date().valueOf().toString();
        const button = new MessageButton()
            .setCustomId(id)
            .setLabel("New Button")
            .setStyle("SECONDARY");
        let success;
        const newMes = copyProps(preview, ["stickers", "nonce"], { enumerable: true, configurable: true, writable: true });
        if (newMes.components[4]?.components.length === 5) success = false;
        else for (let i = 0; i < newMes.components.length + 1; i++) {
            if (newMes.components[i]?.components[0].type === "SELECT_MENU") continue;
            if (!newMes.components[i]) newMes.components[i] = new MessageActionRow();
            if (newMes.components[i].components.length < 5) {
                newMes.components[i].addComponents(button);
                success = true;
                break;
            }
        }
        if (success === false) {
            const no = await inter.reply({ content: "Slot full. Try remove some component", fetchReply: true });
            return delNo(no);
        } else if (success === true) {
            inter.deferUpdate();
            if (!newMes.content) newMes.content = null;
            return preview.edit(newMes);
        } else {
            const no = await inter.reply({ content: "Something went wrong. Contact support pls :(", fetchReply: true });
            return delNo(no);
        }
    }
}

class EditConstruct {
    /**
     * @typedef {object} ParamObjectData
     * @property {number} row
     * @property {number} index
     * @property {import("discord.js").MessageComponentInteraction} promptComponent
     * @property {import("../typins").ShaCommandInteraction} inter
     * @property {import("../typins").ShaMessage} preview 
     * @property {import("../typins").ShaMessage} message 
     * 
     * @param {ParamObjectData} param1 
     * @returns 
     */
    static async BUTTON({ inter, preview, message, row, index, promptComponent, started }) {
        const found = () => preview.components[row].components[index];
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
        message.edit({ content: `Edit button **${found().label}**`, components });
        if (started) return;
        const start = async () => {
            const collectEdit = await promptComponent.message.awaitMessageComponent({
                filter: (r) =>
                    r.user.id === inter.user.id
            });
            if (collectEdit.customId === "messageConstruct/startPage") return;
            else if (collectEdit.customId === "label") {
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
                const prompt = await collectEdit.reply({ content: "Provide emoji:", fetchReply: true });
                const collect = await prompt.channel.awaitMessages({ filter: (r) => r.author.id === inter.user.id, max: 1 });
                const got = collect.first();

                const newMes = copyProps(preview, ["stickers", "nonce"]);
                const hadEmote = !!newMes.components[row].components[index].emoji;
                newMes.components[row].components[index].setEmoji(got.content);
                try {
                    await preview.edit(newMes);
                } catch (e) {
                    if (/Invalid emoji/.test(e.message)) {
                        prompt.edit("Invalid emoji. Provide emoji that you have access to");
                        if (hadEmote) {
                            newMes.components[row].components[index].setEmoji(null);
                            preview.edit(newMes);
                        } else preview.components[row].components[index].setEmoji(null);
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
                const linkStyled = newMes.components[row].components[index].style === "LINK";
                newMes.components[row].components[index].setStyle(collect.customId);
                if (collect.customId === "LINK") {
                    const oldCustomId = newMes.components[row].components[index].customId || ("action:" + new Date().valueOf().toString());
                    delete newMes.components[row].components[index].customId;
                    prompt.edit({ content: "An URL is required for this style, provide URL:", components: [] });
                    const collectLink = await prompt.channel.awaitMessages({ max: 1, filter: (r) => r.author.id === inter.user.id });
                    const gotLink = collectLink.first();
                    try {
                        newMes.components[row].components[index].setURL(gotLink.content);
                        await preview.edit(newMes);
                    } catch (e) {
                        if (/Scheme must be one of/.test(e.message)) {
                            prompt.edit("Invalid URL. Try again");
                            if (linkStyled) {
                                newMes.components[row].components[index].setURL("");
                                newMes.components[row].components[index].setStyle("SECONDARY");
                                newMes.components[row].components[index].setCustomId(oldCustomId);
                                preview.edit(newMes);
                            } else {
                                preview.components[row].components[index].setURL("");
                                preview.components[row].components[index].setStyle("SECONDARY");
                                preview.components[row].components[index].setCustomId(oldCustomId);
                            }
                        } else prompt.edit(replyError(e));
                        delNo(prompt, undefined, gotLink);
                        return start();
                    }
                    delNo(prompt, 0, gotLink);
                    return start();
                } else {
                    if (!newMes.components[row].components[index].customId) {
                        delete newMes.components[row].components[index].url;
                        newMes.components[row].components[index].setCustomId("action:" + new Date().valueOf().toString());
                    }
                    delNo(prompt, 0);
                    preview.edit(newMes);
                    return start();
                }
            } else if (collectEdit.customId === "actions") {
                if (found().style === "LINK") {
                    const ret = await collectEdit.reply({ content: "Actions are not available for link-styled button", fetchReply: true });
                    delNo(ret);
                    return start();
                }
                await settingActions(inter, { found, preview, message, collectEdit }, { inter, preview, message, row, index, promptComponent });
                return start();
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

    async start(edit) {
        if (edit) {
            this.interaction.deferUpdate();
            this.message = this.interaction.message;
            await this.message.edit({ content: "Provide message link of the message to edit:", components: [] });
            const get = await this.channel.awaitMessages({ filter: (r) => r.content.length && r.author.id === this.interaction.user.id, max: 1, });
            const getM = get?.first();
            if (!getM) return;
            if (this.channel.permissionsFor(this.client.user).has("MANAGE_MESSAGES")) getM.delete();
            const getMsg = await getChannelMessage(this.interaction, getM.content, null, this.interaction.client.isOwner(this.interaction.user));
            if (!getMsg) return this.message.edit("Unknown message");
            if (getMsg.author?.id !== this.client.user.id) return this.message.edit("I can only edit my own message bruh >:(");
            this.preview = getMsg;
            await this.message.edit(startPage);
        } else {
            await this.preview.edit({ content: "`[EMPTY]`", components: [] });
            this.message = await this.interaction.reply({ ...startPage, fetchReply: true });
            this.message.interaction = this.interaction;
        }
        return this.message.messageConstruct = this;
    }

    async getComponent(inter, op) {
        if (!this.preview.components.length) {
            const no = await inter.reply({ content: `Add some component first to ${op} it`, fetchReply: true });
            return delNo(no);
        }
        inter.deferUpdate();
        const newPreview = copyProps(this.preview, ["stickers", "nonce"]);
        for (let c1i = 0; c1i < newPreview.components.length; c1i++) {
            for (let c2i = 0; c2i < newPreview.components[c1i].components.length; c2i++) {
                const tar = newPreview.components[c1i].components[c2i];
                if (tar.type === "BUTTON" && tar.style === "LINK") {
                    newPreview.components[c1i].components[c2i].setLabel(("[LINK] " + tar.label).slice(0, 80));
                    newPreview.components[c1i].components[c2i].setCustomId(tar.url);
                    newPreview.components[c1i].components[c2i].setStyle("SECONDARY");
                    newPreview.components[c1i].components[c2i].setURL("");
                }
            }
        }
        const prompt = await this.message.edit({ content: `Which component you want to ${op}?`, components: newPreview.components, fetchReply: true });
        const promptComponent = await prompt.awaitMessageComponent({ filter: (r) => r.user.id === this.user.id });

        let row = -1, index = -1, found;
        for (let iRow = 0; iRow < this.preview.components.length; iRow++) {
            row = iRow;
            const len = this.preview.components[iRow];
            if (!len.components.length) continue;
            for (let iC = 0; iC < len.components.length; iC++) {
                index = iC;
                if ((len.components[iC].customId || len.components[iC].url) !== promptComponent.customId) continue;
                found = len.components[iC];
                break;
            }
            if (found) break;
        }
        promptComponent.deferUpdate();
        return { row, index, promptComponent, found };
    }

    async add(inter, args) {
        AddConstruct[args[0]](inter, this.preview, this.message, args.slice(1));
    }

    async edit(inter, args) {
        const { row, index, promptComponent, found } = await this.getComponent(inter, "edit");
        if (!found) return;
        EditConstruct[found.type]({ inter, preview: this.preview, message: this.message, row, index, promptComponent });
    }

    async remove(inter, args) {
        const { row, index, promptComponent } = await this.getComponent(inter, "remove");
        RemoveConstruct[args[0]](inter, this.preview, this.message, args.slice(1));
    }

    async startPage(inter) {
        if (inter) inter.deferUpdate();
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

async function settingActions(inter, { found, preview, message, collectEdit } = {}, startData) {
    const ActionsClass = new Actions(inter.client);
    await collectEdit.deferUpdate();
    loadDb(preview, `message/${preview.channelId}/${preview.id}`);
    const baseEmb = new MessageEmbed()
        .setTitle(`Actions`)
        .setColor(getColor(inter.user.accentColor, true, inter.member?.displayColor));

    const getEmbed = async () => {
        const settings = await preview.db.getOne("action", found().customId);
        const emb = new MessageEmbed(baseEmb);
        const N = () => "`" + (emb.fields.length + 1) + "#`: ";
        if (settings?.value.actions.length) {
            for (const val of settings.value.actions) {
                if (val.type === "roles") {
                    const desc = `\`${"Action".padEnd(12, " ")}\`: \`${val.action
                        ? val.action[0].toUpperCase() + val.action.slice(1)
                        : "Give and Take"}\`\n`
                        + `\`${"Synchronize".padEnd(12, " ")}\`: ${strYesNo(val.sync)}\n`
                        + `\`${"Roles".padEnd(12, " ")}\`: <@&${val.roles.join(">, <@&")}>`;
                    emb.addField(N() + val.type[0].toUpperCase() + val.type.slice(1), desc);
                }
            }
        }
        if (!emb.fields?.length) emb.setDescription("No actions set for this message component yet");
        return emb;
    }

    message.actionStartPage = async (replaceContent) => {
        return message.edit({ embeds: [await getEmbed()], components: [settingActionsButtons], ...replaceContent });
    };
    await message.actionStartPage();
    message.actionsConstruct = async ({ started = true } = {}) => {
        const getOp = await message.awaitMessageComponent({ filter: (r) => r.user.id === inter.user.id });
        let res;
        const configure = async ({ edit, remove } = {}) => {
            if (remove) {
                const settings = await preview.db.getOne("action", found().customId);
                settings.value.actions.splice(remove - 1, 1);
                preview.db.set("action", found().customId, { value: settings.value });
                message.actionStartPage({ content: null });
                return;
            }
            const descriptors = Object.getOwnPropertyDescriptors(Object.getPrototypeOf(ActionsClass));
            const keys = Object.keys(descriptors).filter(r => r !== "constructor" && typeof descriptors[r].value === "function");
            const selectMenuItems = [];
            for (let s = 0; s < keys.length; s += 10) {
                const to = s + 10;
                const tP = [];
                for (let i = s; i < to; i++) {
                    if (!keys[i]) break;
                    tP.push({
                        label: `${keys[i][0].toUpperCase()}${keys[i].slice(1)}`,
                        value: keys[i],
                        description: await ActionsClass[keys[i]]({
                            method: {
                                get: "description"
                            }
                        })
                    });
                }
                selectMenuItems.push(tP);
            };
            const rows = selectMenuItems.map(
                r => new MessageActionRow().addComponents(new MessageSelectMenu()
                    .setCustomId("settingActions")
                    .addOptions(r)
                    .setMaxValues(1)
                    .setPlaceholder("Pick action..."))
            );
            await message.edit({ content: "Pick an action for this component", components: rows });
            const pickedAction = await message.awaitMessageComponent({ filter: (r) => r.user.id === inter.user.id });
            if (!pickedAction) return;
            res = await ActionsClass[pickedAction.values[0]]({ edit, found, message, preview, interaction: pickedAction, method: { set: "action" } });
        }
        if (getOp.customId === "add") {
            started = false;
            getOp.deferUpdate();
            await configure();
        } else if (getOp.customId === "edit") {
            started = false;
            if (message.embeds[0].fields.length) {
                const prompt = await getOp.reply({ content: "Provide action number to edit:", fetchReply: true });
                const getP = await prompt.channel.awaitMessages({ filter: (r) => r.author.id === inter.user.id && /^\d{1,2}/.test(r.content), max: 1 });
                const getC = getP.first();
                if (!getC) return;
                const edit = parseInt(getC.content, 10);
                if (edit > 0) {
                    delNo(prompt, 0, getC);
                    await configure({ edit });
                } else {
                    prompt.edit({ content: "Invalid action number provided! Try again" });
                    delNo(prompt, undefined, getC);
                }
            } else {
                const no = await getOp.reply({ content: "No action to edit! Add some action first", fetchReply: true });
                delNo(no);
            }
        } else if (getOp.customId === "remove") {
            started = false;
            if (message.embeds[0].fields.length) {
                const prompt = await getOp.reply({ content: "Provide action number to remove:", fetchReply: true });
                const getP = await prompt.channel.awaitMessages({ filter: (r) => r.author.id === inter.user.id && /^\d{1,2}/.test(r.content), max: 1 });
                const getC = getP.first();
                if (!getC) return;
                const remove = parseInt(getC.content, 10);
                if (remove > 0 && remove <= message.embeds[0].fields.length) {
                    delNo(prompt, 0, getC);
                    await configure({ remove });
                } else {
                    prompt.edit({ content: "Invalid action number provided! Try again" });
                    delNo(prompt, undefined, getC);
                }
            } else {
                const no = await getOp.reply({ content: "No action to remove! Add some action first", fetchReply: true });
                delNo(no);
            }
        } else if (getOp.customId === "done") {
            getOp.deferUpdate();
            res = true;
        }
        if (res) {
            if (res === "actionStartPage") {
                await message.actionStartPage({ content: null });
                message.actionsConstruct({ started });
            } else if (startData) EditConstruct[found().type]({ ...startData, started });
            else message.messageConstruct.startPage();
        } else message.actionsConstruct({ started });
    }
    return message.actionsConstruct();
}
