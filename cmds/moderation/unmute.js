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
            const L = USER.getMutedIn(msg.guild.id);

            if (!L.data) { notMuted.push(USER.id); continue } else {
                await USER.unmute(msg.guild, msg.member, reason)
                    .then(() => {
                        success.push(USER.id);
                        const emb = defaultEventLogEmbed(msg.guild);

                        emb.setTitle("You have been unmuted")
                            .setDescription("**Reason**\n" + reason);

                        USER.createDM().then(r => trySend(msg.client, r, emb));
                    })
                    .catch((e) => {
                        console.log(e); cant.push(USER.id)
                    });
            }
        }

        let emb = defaultImageEmbed(msg, null, "Unmute");
        if (cant.length > 0) emb.addField("Can't unmute", "<@" + cant.join(">, <@") + ">");
        if (notMuted.length > 0) emb.addField("Wasn't muted", "<@" + notMuted.join(">, <@") + ">");
        emb.setDescription("**Unmuted**\n" + (success.length > 0 ? "<@" + success.join(">, <@") + ">" : "`[NONE]`"))
            .addField("Reason", reason);
        return trySend(msg.client, msg, { content: resultMsg, embed: emb });
    }
}