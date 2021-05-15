'use strict';

const { trySend } = require("../../resources/functions");

const commando = require("@iceprod/discord.js-commando"),
{ database } = require("../../database/mongo"),
col = database.collection("Experiment");

module.exports = class dropexp extends commando.Command {
    constructor(client) {
        super(client, {
            name: "dropexp",
            memberName: "dropexp",
            group: "experiment",
            description: "description",
            ownerOnly:true
        });
    }
    run(msg, arg) {
        col.drop().then(trySend(this.client, msg, "cleared")).catch(e => trySend(this.client, msg, `\`\`\`js\n${e.stack}\`\`\``));
    }
};