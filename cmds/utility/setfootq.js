'use strict';

const commando = require("@iceprod/discord.js-commando");
const { ranLog, errLog, trySend } = require("../../resources/functions");
const { database } = require("../../database/mongo");

module.exports = class setfootq extends commando.Command {
    constructor(client) {
        super(client, {
            name: "setfootq",
            aliases:["setfooterquote"],
            memberName: "setfootq",
            group: "utility",
            description: "Set server embed footer text."
        });
    }
    async run(msg, args) {
        try {
            if (!msg.guild?.member(msg.author).hasPermission("MANAGE_GUILD" && !this.client.owners.includes(msg.author))) {
                return trySend(this.client, msg, 'No lol');
            }
            const data = msg.guild ? "Guild" : "User";
            const col = database.collection(data);
            const doc = msg.guild?.id ?? msg.author.id;
            const oldQ = await col.findOne({document: doc});
            col.updateOne({document: doc}, {$set: {"settings.defaultEmbed.footerQuote": args.trim()}}, { upsert: true }, async (e) => {
                if (e) {
                    return errLog(e, msg, this.client);
                }
                const result = await trySend(this.client, msg, `Changed from \`${oldQ?.["settings"]?.defaultEmbed?.footerQuote}\` to \`${args.trim()}\``);
                return ranLog(msg, "setfooterquote", result.content);
            });
        } catch (e) {
            return errLog(e, msg, this.client);
        }
    }
};