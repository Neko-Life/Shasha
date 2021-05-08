'use strict';

const commando = require("@iceprod/discord.js-commando");
const { ranLog, trySend, errLog } = require("../../resources/functions");
const { database } = require("../../database/mongo");

module.exports = class resetdatabase extends commando.Command {
    constructor(client) {
        super(client, {
            name: "resetdatabase",
            memberName: "resetdatabase",
            group: "experiment",
            description: "Reset your server/private database."
        });
    }
    async run(msg) {
        const doc = msg.guild?.id ?? msg.author.id;
        const col = database.collection(msg.guild ? "Guild" : "User");
        trySend(this.client, msg, "Are you sure? You will lose every saved settings. This process can't be undone. Type `yes` in 30 seconds to confirm.");
        const confirm = msg.channel.createMessageCollector(() => true, {time:30000});
        confirm.on("collect", h => {
            if (h.author === msg.author) {
                if (h.content.trim() === "yes") {
                    col.findOneAndDelete({document: doc})
                    .then(
                        trySend(this.client, msg, "Wiped!"))
                    .catch(e => errLog(e, msg, this.client));
                } else {
                    trySend(this.client, msg, "Request aborted.");
                }
                confirm.stop();
                return ranLog(msg, "resetdatabase", h.content);
            }
        });
    }
};