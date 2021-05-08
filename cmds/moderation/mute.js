'use strict';

const commando = require("@iceprod/discord.js-commando");
const { getUser, trySend } = require("../../resources/functions");
const { database } = require("../../database/mongo");
const { muteDurationMultiplier } = require("../../resources/date");
const col = database.collection("Guild");
const dbExp = database.collection("Experiment");

module.exports = class mute extends commando.Command {
    constructor(client) {
        super(client, {
            name: "mute",
            memberName: "mute",
            group: "moderation",
            description: "Mute.",
            guildOnly: true,
            userPermissions:['MANAGE_ROLES']
        });
    }
    /**
     * 
     * @param {commando.CommandoMessage} msg 
     * @param {*} arg 
     * @returns 
     */
    async run(msg, arg) {
        const doc = await col.findOne({document: msg.guild.id});
        const muteConf = doc?.["moderation"]?.mute;
        const args = arg.trim().split(/ +/);
        const setArgs = arg.trim().split(/(\-\-)+/);
        /* if (config.mute.role.length === 0) {
            return msg.channel.send(`Mute role isn't set! Run \`${this.client.commandPrefix}mute --role <role_[mention, ID]>\`. If you insist i will just give them admin perms <:purifyLife:774102054046007298>`)
        }
        if (setArgs) {
            for(let set of setArgs) {
                set = set.toLowerCase();
                switch(set) {
                    case startsWith('role'): {
                        let role = set.slice('role'.length).trim();
                        if (role.startsWith('<&')) {
                            role = role.slice(2,-1);
                        }
                        //const foundRole = 
                    }
                }
            }
        }*/
        if (args[0]) {
            const targetUser = await getUser(this.client, msg, args[0]);
            if (targetUser) {
                let duration = muteConf?.defaultDuration;
                if (/^\d+(?![^ymwdhs])[ymwdhs]?o?/i.test(args[1])) {
                    duration = 0;
                    const durationRegExp = /\d+(?![^ymwdhs])[ymwdhs]?o?/gi;
                    const durationArg = args[1].match(durationRegExp);
                    for (const value of durationArg) {
                        //console.log(value);
                        if (value.endsWith("h") || value.endsWith("ho")) {
                            duration = muteDurationMultiplier(duration, value, 60 * 60 * 1000);
                        }
                        if (value.endsWith("y")) {
                            duration = muteDurationMultiplier(duration, value, 365 * 24 * 60 * 60 * 1000);
                        }
                        if (value.endsWith("mo")) {
                            duration = muteDurationMultiplier(duration, value, 30 * 24 * 60 * 60 * 1000)
                        }
                        if (value.endsWith("w")) {
                            duration = muteDurationMultiplier(duration, value, 7 * 24 * 60 * 60 * 1000)
                        }
                        if (value.endsWith("d")) {
                            duration = muteDurationMultiplier(duration, value, 24 * 60 * 60 * 1000)
                        }
                        if (value.endsWith("m")) {
                            duration = muteDurationMultiplier(duration, value, 60 * 1000)
                        }
                        if (value.endsWith("s")) {
                            duration = muteDurationMultiplier(duration, value, 1000)
                        }
                        if (!/\D/.test(value)) {
                            duration = muteDurationMultiplier(duration, value, 1000)
                        }
                    }
                    const dateDur = new Date(msg.createdAt.valueOf() + duration).toUTCString();
                    /*const yearDate = dateDur.getFullYear();
                    const monthDate = dateDur.getMonth();
                    const dayDate = dateDur.getDay();
                    const hourDate = dateDur.getHours();
                    const minuteDate = dateDur.getMinutes();
                    const secondDate = dateDur.getSeconds();*/
                    return trySend(this.client, msg, `Result:\`\`\`js\n${duration} ms\n${dateDur}\`\`\``);
                }
            } else
            return trySend(this.client, msg, "No user with that ID.");
        }
    }
};