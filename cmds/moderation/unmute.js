'use strict';

const commando = require("@iceprod/discord.js-commando");
const { parseDoubleDash, trySend, defaultImageEmbed, parseComa, defaultEventLogEmbed } = require("../../resources/functions");
const targetUser = require("./src/targetUser");

module.exports = class unmute extends commando.Command {
    constructor(client) {
        super(client, {
            name: "unmute",
            memberName: "unmute",
            group: "moderation",
            description: "Mute.",
            details: "Args: `user_[mention|name|ID] -- [reason]`",
            guildOnly: true,
            userPermissions: ['MANAGE_ROLES'],
            clientPermissions: ['MANAGE_ROLES']
        });
    }

    async run(msg, arg) {
        if (!msg.guild.DB) await msg.guild.dbLoad();
        msg.channel.startTyping();
        if (!arg) return trySend(msg.client, msg, this.details);
        const args = parseDoubleDash(arg),
            mentions = parseComa(args.shift());
        let reason = "No reason provided", targetUsers = [], resultMsg = "";
        if (args?.length > 0) {
            for (const ARG of args) if (!ARG || ARG === "--" || ARG.trim().length === 0) continue; else reason = ARG.trim();
        }
        if (mentions?.length > 0) {
            const FR = await targetUser(msg, mentions, targetUsers, resultMsg);
            console.log(FR);
            targetUsers = FR.targetUser;
            resultMsg = FR.resultMsg;
        }
        let notMuted = [],
            cant = [], success = [];

        for (const USER of targetUsers) {
            if (!USER.DB) await USER.dbLoad();

            await USER.unmute(msg.guild, msg.member, reason)
                .then(() => {
                    success.push(USER.id);
                })
                .catch((e) => {
                    console.log(e);
                    if (/isn't muted in/.test(e.message)) return notMuted.push(USER.id);
                    cant.push(USER.id);
                });
        }

        const emb = defaultImageEmbed(msg, null, "Unmute");
        emb.setDescription("**Reason**\n" + reason)
            .addField("Unmuted", (success.length > 0 ? "<@" + success.join(">, <@") + ">" : "`[NONE]`"));
        if (cant.length > 0) emb.addField("Can't unmute", "<@" + cant.join(">, <@") + ">");
        if (notMuted.length > 0) emb.addField("Wasn't muted", "<@" + notMuted.join(">, <@") + ">");
        return trySend(msg.client, msg, { content: resultMsg, embed: emb });
    }
}