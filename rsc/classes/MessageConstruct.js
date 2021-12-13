'use strict';

const { ButtonInteraction, MessageActionRow, MessageButton, MessageSelectMenu } = require("discord.js");
const { copyProps } = require("../functions");

const messageConstructButtons = [
    new MessageActionRow()
        .addComponents([
            new MessageButton().setCustomId("messageConstruct/add/button").setLabel("Add Button").setStyle("PRIMARY"),
            new MessageButton().setCustomId("messageConstruct/add/selectMenu").setLabel("Add Select Menu").setStyle("PRIMARY"),
            new MessageButton().setCustomId("messageConstruct/add/embeds").setLabel("Add Embeds").setStyle("PRIMARY"),
            new MessageButton().setCustomId("messageConstruct/set/content").setLabel("Set Text Content").setStyle("PRIMARY")
        ]),
    new MessageActionRow()
        .addComponents([
            new MessageButton().setCustomId("messageConstruct/edit").setLabel("Edit Component").setStyle("PRIMARY")
        ]),
    new MessageActionRow()
        .addComponents([
            new MessageButton().setCustomId("messageConstruct/remove").setLabel("Remove Component").setStyle("DANGER")
        ])
];

const startPage = { content: "Add some components to your message", components: messageConstructButtons };

class AddConstruct {
    /**
     * 
     * @param {import("../typins").ShaMessage} preview 
     * @param {import("../typins").ShaMessage} message 
     */
    static async button(preview, message, args) {
        const id = new Date().valueOf().toString();
        const button = new MessageButton()
            .setCustomId(id)
            .setLabel("Button " + id.slice(-3) + id[id.length - 5])
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
        if (success === false) {
            const no = await message.channel.send("Slot full! Can't add more component");
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
     */
    static async button(preview, message, args) {
        if (!args?.length) {
            const buttons = [];
            for (const K of preview.components)
                for (const I of K.components) {
                    if (I.type !== "BUTTON") continue;
                    const newB = copyProps(I, [], { writable: true });
                    buttons.push(newB.setCustomId(`messageConstruct/edit/button/${newB.customId}`));
                }
            const rows = [];
            let row = new MessageActionRow();
            if (!buttons.length) {
                const no = await message.channel.send("Add some button first to edit it");
                return delNo(no);
            } else for (let i = 0; i < buttons.length; i++) {
                row.addComponents(buttons[i]);
                if (row.components.length === 5 || !buttons[i + 1]) {
                    rows.push(row);
                    row = new MessageActionRow();
                }
            }
            return message.edit({ content: "Which button you wanna edit?", components: rows });
        }
        /** @type {MessageButton} */
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
        return this.message.messageConstruct = this;
    }

    async add(args) {
        AddConstruct[args[0]](this.preview, this.message, args.slice(1));
    }

    async edit(args) {
        EditConstruct[args[0]](this.preview, this.message, args.slice(1));
    }

    async remove(args) {
        RemoveConstruct[args[0]](this.preview, this.message, args.slice(1));
    }
}

module.exports = { MessageConstruct }

function delNo(msg, timeout = 10000) {
    setTimeout(
        () => {
            if (msg?.deleted || !msg.deletable) return;
            msg.delete();
        }, timeout
    );
    return msg;
}