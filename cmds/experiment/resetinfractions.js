'use strict';

const commando = require("@iceprod/discord.js-commando"),
{ database } = require("../../database/mongo");
const { trySend } = require("../../resources/functions"),
col = database.collection("Guild");

module.exports = class resetinfractions extends commando.Command {
    constructor(client) {
        super(client, {
            name: "resetinfractions",
            memberName: "resetinfractions",
            group: "experiment",
            description: "description",
            guildOnly:true,
            ownerOnly:true
        });
    }
    run(msg) {
        col.updateOne({document:msg.guild.id}, {$set:{"moderation.infractions":[]}}, {upsert:true}, (e, r) => {
            if (e) {
                return trySend(this.client, msg, "```js\n"+e.stack+"```");
            }
            col.updateOne({document:msg.guild.id}, {$set:{"moderation.settings.mute": {}}});
            return trySend(this.client, msg, "Wiped!");
        });
    }
};