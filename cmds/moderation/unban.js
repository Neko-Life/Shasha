const commando = require("@iceprod/discord.js-commando");
const { parseDoubleDash, parseComa, trySend, defaultEventLogEmbed, errLog } = require("../../resources/functions");
const targetUser = require("./src/targetUser");

module.exports = class unbanCmd extends commando.Command {
    constructor(client) {
        super(client, {
            name: "unban",
            memberName: "unban",
            group: "moderation",
            description: "Unban user from your server",
            guildOnly: true
        });
    }

    async run(msg, arg) {
        const CL = msg.guild.member(msg.client.user);
        if (!msg.member.isAdmin) return trySend(msg.client, msg, "are they your friend? <:nekokekLife:852865942530949160>");
        if (!CL.isAdmin) return trySend(msg.client, msg, "I don't have the power to do that <:pepewhysobLife:853237646666891274>");
        if (!arg) return trySend(msg.client, msg, "Provide `user_ID` to unban. Separate `user` with `,`. Example:```js\n" +
            `${msg.guild.commandPrefix + this.name} 757453290714824844, 706039105540194314, 198558078508072960 ` +
            `-- sent me some nice materials for tonight\`\`\``);
        const args = parseDoubleDash(arg),
            target = parseComa(args?.shift());
        let reason = "No reason provided", execTarget = [], resultMsg = "";
        if (args[1]?.trim().length) reason = args[1].trim();
        const F = await targetUser(msg, target);
        execTarget = F.targetUser;
        resultMsg = F.resultMsg;
        if (!execTarget.length) return trySend(msg.client, msg, resultMsg);

        let success = [], cant = [];
        for (const T of execTarget) {
            try {
                await T.unban(msg.guild, msg.member, reason);
                success.push(T.id);
            } catch (e) {
                errLog(e, msg, msg.client, true, "", true);
                cant.push(T.id);
            }

            const emb = defaultEventLogEmbed(msg.guild);
            if (cant.length) emb.addField("Can't unban", "<@" + cant.join(">, <@") + ">");
            emb.setDescription(reason)
                .setTitle("Unban")
                .addField("Unbanned", success.length ? "<@" + success.join(">, <@") + ">" : "`[NONE]`");
            return trySend(msg.client, msg, emb);
        }
    }
};