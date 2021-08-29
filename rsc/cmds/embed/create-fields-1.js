'use strict';

const { CommandInteraction, Util } = require("discord.js");
const { Command } = require("../../classes/Command");
const createJSONEmbedFields = require("../../rsc/createJSONEmbedFields");

module.exports = class CreateFields1 extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "create-fields-1",
            clientPermissions: ["SEND_MESSAGES"],
            userPermissions: [
                "SEND_MESSAGES"
            ]
        });
    }

    /**
     * @param {CommandInteraction} inter
     */
    async run(inter, fields) {
        const fieldsArr = await createJSONEmbedFields(inter, fields);
        const cont = Util.splitMessage(
            "#fields_data_1.<_version>```js\n" + JSON.stringify(fieldsArr) + "```",
            {
                prepend: "#fields_data_1.<_version>```js\n",
                append: "```",
                maxLength: 2000,
                char: ","
            }
        )
        let sI = 0;
        const ret = [];
        for (const U of cont) {
            const res = await inter.channel.send({
                content: U.replace("<_version>", sI)
            });
            res.fieldData = 1;
            res.fieldDataVersion = sI++;
            ret.push(res);
        }
        inter.editReply("Created. Use the latest message of fields data messages to use in `embed build` command.");
        return ret;
    }
}