'use strict';

const { CommandInteraction, Util } = require("discord.js");
const { Command } = require("../../classes/Command");
const createJSONEmbedFields = require("../../rsc/createJSONEmbedFields");
const FD_SPLIT_CONF = {
    prepend: "#fields_data_3.<_version>```js\n",
    append: "```",
    maxLength: 2000,
    char: ","
}

module.exports = class CreateFields3 extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "create-fields-3",
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
            FD_SPLIT_CONF.prepend + JSON.stringify(fieldsArr) + FD_SPLIT_CONF.append,
            FD_SPLIT_CONF
        )
        let sI = 0;
        const ret = [];
        for (const U of cont) {
            const res = await inter.channel.send({
                content: U.replace("<_version>", sI)
            });
            res.fieldData = 3;
            res.fieldDataVersion = sI++;
            ret.push(res);
        }
        inter.editReply("Provide these message Ids to be used in `embed build fieldDatas` command option,"
            + " separated with ` ` (space) ```js\n"
            + ret.map(r => r.id).join(" ")
            + "```");
        return ret;
    }
}