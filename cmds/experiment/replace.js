'use strict';

const commando = require("@iceprod/discord.js-commando");
const { cleanMentionID, trySend } = require("../../resources/functions");

module.exports = class replace extends commando.Command {
    constructor(client) {
        super(client, {
            name: "replace",
            memberName: "replace",
            group: "experiment",
            description: "replace test"
        });
    }
    /**
     * 
     * @param {commando.CommandoMessage} msg 
     * @param {*} arg 
     */
    async run(msg, arg) {
        const args = arg.split(" "),
        targetID = cleanMentionID(args[0]),
        targetUser = msg.guild.member(targetID);
        await targetUser.roles.remove(targetUser.roles.cache.array()).catch(e => trySend(this.client, msg, "```js\n" + e.stack + "```"));
        await targetUser.roles.add("772114626720432128").catch(e => trySend(this.client, msg, "```js\n" + e.stack + "```"));
        //trySend(this.client, msg, "```js\n"+JSON.stringify(mes, null, 2)+"```");
        trySend(this.client, msg, "Replaced!");
    }
};