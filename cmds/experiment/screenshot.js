'use strict';

const { cleanMentionID, trySend } = require("../../resources/functions");

const commando = require("@iceprod/discord.js-commando"),
{ database } = require("../../database/mongo"),
dbExp = database.collection("Experiment");

module.exports = class screenshot extends commando.Command {
    constructor(client) {
        super(client, {
            name: "screenshot",
            memberName: "screenshot",
            group: "experiment",
            description: "description"
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
        targetUser = msg.guild.member(targetID),
        test = targetUser.roles.cache.map(r => r.id);
        //trySend(this.client,msg,{content:`\`\`\`js\n${test}\`\`\``,split:true})
        await dbExp.insertOne({ rolesScreenshot: { name: targetUser.id, data: test }}).catch(e => trySend(this.client, msg, "```js\n" + e.stack + "```"));
        trySend(this.client, msg, "Sceenshoted!")
    }
};