'use strict';

const { CommandInteraction } = require("discord.js");
const { Command } = require("../../classes/Command");

module.exports = class CreateField1 extends Command {
    constructor(interaction) {
        super(interaction, { name: "create-fields-1" });
    }

    /**
     * @param {CommandInteraction} inter
     */
    async run(inter, fields) {
        await inter.deferReply();
        let fieldsArr = []
        for (const U in fields) {
            const args = U.split("-");
            const index = parseInt(args[1], 10) - 1;
            if (!fieldsArr[index]) fieldsArr[index] = {};
            if (args[2] === "name") fieldsArr[index].name = fields[U].value;
            else if (args[2] === "text") fieldsArr[index].value = fields[U].value;
            else if (args[2] === "inline")
                fieldsArr[index].inline = ["yes", "true", "1"]
                    .includes(fields[U].value.trim().toLowerCase());
        }
        return inter.editReply("#fields_data_1```js\n" + JSON.stringify(fieldsArr) + "```");
    }
}