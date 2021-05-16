'use strict';

const { trySend, cleanMentionID } = require("../../resources/functions");

const commando = require("@iceprod/discord.js-commando"),
{ database } = require("../../database/mongo"),
col = database.collection("Experiment");

module.exports = class regive extends commando.Command {
    constructor(client) {
        super(client, {
            name: "regive",
            memberName: "regive",
            group: "experiment",
            description: "description"
        });
    }
    /**
     * 
     * @param {commando.CommandoMessage} msg 
     * @param {*} arg 
     */
    async run(msg, arg ) {
        const args = arg.split(" "),
        member = msg.guild.member(cleanMentionID(args[0])),
        doc = await col.findOne({"rolesScreenshot.name":member.id}).catch(e => trySend(this.client, msg, "```js\n" + e.stack + "```")),
        test = doc.rolesScreenshot.data;
        await member.roles.add(test.map(r => r)).catch(e => trySend(this.client, msg, "```js\n" + e.stack + "```"));
        await member.roles.remove("772114626720432128").catch(e => trySend(this.client, msg, "```js\n" + e.stack + "```"))
        trySend(this.client, msg, "Success!"+"```js\n"+JSON.stringify(test, null, 2)+"```");
    }
};