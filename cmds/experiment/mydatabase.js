'use strict';

const commando = require("@iceprod/discord.js-commando");
const { errLog, trySend, ranLog } = require("../../resources/functions");
const { database } = require("../../database/mongo");

module.exports = class mydatabase extends commando.Command {
    constructor(client) {
        super(client, {
            name: "mydatabase",
            memberName: "mydatabase",
            group: "experiment",
            description: "Show all document collection."
        });
    }
    run(msg) {
        const data = msg.guild ? "Guild" : "User";
        const doc = msg.guild?.id ?? msg.author.id;
        database.collection(data).find({document: doc}).toArray(async (e, fetched) => {
            if (e) {
                return errLog(e, msg, this.client);
            }
            let mes = `Fetched documents for ${msg.guild ? `server **${msg.guild.name}**` : `**${msg.author.tag}**`}`;
            mes = `${mes}\`\`\`js\n${JSON.stringify(fetched, null, 2)}\`\`\``;
            trySend(this.client, msg, mes);
            return ranLog(msg, "mydatabase", fetched);
        });
    }
};