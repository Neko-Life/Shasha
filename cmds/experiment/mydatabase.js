'use strict';

const commando = require("@iceprod/discord.js-commando");
const { errLog, trySend, ranLog } = require("../../resources/functions");
const { database } = require("../../database/mongo");
const exp = database.collection("Experiment");

module.exports = class mydatabase extends commando.Command {
    constructor(client) {
        super(client, {
            name: "mydatabase",
            memberName: "mydatabase",
            group: "experiment",
            description: "Show all document collection.",
            ownerOnly:true
        });
    }
    async run(msg) {
        if (msg.guild ? !msg.member.hasPermission("MANAGE_GUILD") : false) {
            return trySend(this.client, msg, "No");
        }
        const data = msg.guild ? "Guild" : "User";
        const doc = msg.guild?.id ?? msg.author.id,
        dbExp = await exp.find({}).toArray();
        database.collection(data).find({document: doc}).toArray(async (e, fetched) => {
            if (e) {
                return errLog(e, msg, this.client);
            }
            let mes = `Fetched documents for ${msg.guild ? `server **${msg.guild.name}**` : `**${msg.author.tag}**`}`;
            mes = `${mes}\`\`\`js\n${JSON.stringify(fetched, null, 2)}\`\`\`` + `\`\`\`js\n${JSON.stringify(dbExp, null, 2)}\`\`\``;
            trySend(this.client, msg, {content:mes,split:{maxLength:2000,append:",```",prepend:"```js\n",char:","}});
            return ranLog(msg, "mydatabase", fetched);
        });
    }
};