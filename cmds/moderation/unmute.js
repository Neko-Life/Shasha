'use strict';

const commando = require("@iceprod/discord.js-commando");
const { parseDoubleDash, trySend, parseComa, defaultEventLogEmbed } = require("../../resources/functions");
const targetUser = require("./src/targetUser");

module.exports = class unmute extends commando.Command {
    constructor(client) {
        super(client, {
            name: "unmute",
            memberName: "unmute",
            group: "moderation",
            description: "Mute.",
            guildOnly: true
        });
    }

    async run(msg, arg) {
        const CL = msg.guild.member(msg.client.user);
        if (!(msg.member.isAdmin || msg.member.hasPermission("MANAGE_ROLES"))) return trySend(msg.client, msg, "I refusee! <:nekohmLife:846371737644957786>");
        if (!(CL.isAdmin || CL.hasPermission("MANAGE_ROLES"))) return trySend(msg.client, msg, "I don't have the power to do that <:pepewhysobLife:853237646666891274>");
        if (!msg.guild.DB) await msg.guild.dbLoad();
        msg.channel.startTyping();
        if (!arg) return trySend(msg.client, msg, "Provide `user_ID` to unmute. Separate `user` with `,`. Example:```js\n" +
            `${msg.guild.commandPrefix + this.name} uwu#123, 198558078508072960, elite guitarist -- They got nice manners irl\`\`\``);
        const args = parseDoubleDash(arg),
            mentions = parseComa(args.shift());
        let reason = "No reason provided", targetUsers = [], resultMsg = "";
        if (args[1]?.trim().length) reason = args[1].trim();
        if (mentions?.length) {
            const FR = await targetUser(msg, mentions, targetUsers, resultMsg);
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

        const emb = defaultEventLogEmbed(msg.guild);
        if (notMuted.length) emb.addField("Wasn't muted", "<@" + notMuted.join(">, <@") + ">");

        emb.setTitle("Unmute")
            .setDescription(reason)
            .addField("Unmuted", (success.length ? "<@" + success.join(">, <@") + ">" : "`[NONE]`"));
        if (cant.length) emb.addField("Can't unmute", "<@" + cant.join(">, <@") + ">");
        return trySend(msg.client, msg, { content: resultMsg, embed: emb });
    }
}