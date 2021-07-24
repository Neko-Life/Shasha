'use strict';

const commando = require("@iceprod/discord.js-commando");
const { ranLog, errLog, trySend } = require("../../resources/functions");
const { database } = require("../../database/mongo");

module.exports = class setfootq extends commando.Command {
    constructor(client) {
        super(client, {
            name: "setfootq",
            aliases: ["setfooterquote"],
            memberName: "setfootq",
            group: "utility",
            description: "Set server embed footer text.",
            userPermissions: ["MANAGE_GUILD"]
        });
    }
    async run(msg, args) {
        try {
            let oldQ = msg.guild ? msg.guild.DB.defaultEmbed : msg.author.DB.defaultEmbed;
            if (!oldQ) oldQ = {};
            const newQ = oldQ?.footerQuote;
            oldQ.footerQuote = args.trim();
            const r = msg.guild ? msg.guild.setDefaultEmbed(oldQ) : msg.author.setDefaultEmbed(oldQ);
            if (r) {
                const result = await trySend(this.client, msg, `Changed from \`${newQ?.length > 0 ? newQ : "none"}\` to \`${oldQ.footerQuote?.length > 0 ? oldQ.footerQuote : "none"}\``);
                await ranLog(msg, result.content);
                return result;
            } else {
                return trySend(this.client, msg, "Somethin's wrong <:WhenLife:773061840351657984>");
            }
        } catch (e) {
            return errLog(e, msg, this.client);
        }
    }
};