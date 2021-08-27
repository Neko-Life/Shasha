'use strict';

const Bree = require("bree");
const cabin = require("cabin");
const { Client } = require("discord.js");
const { errLog } = require("./functions");

/**
 * @param {Client} client
 * @param {object[]} jobs
 * @returns {Bree}
 */
function scheduler(client, jobs = []) {
    return new Bree({
        // logger: new cabin,
        root: false,
        jobs: jobs,
        workerMessageHandler: ({ message }) => {
            if (!message[0]) throw new Error("Value undefined!");
            if (message[0] === "REFRESH JOBS") return require("../cmds/moderation/src/createSchedule").reset();
            if (!message[1] || !message[2]) throw new Error("Name undefined!");
            return execPunishmentSchedule(client, message[0], message[1], message[2]);
        },
        errorHandler: (e, m) => {
            return errLog(e, null, client, false, `\`${m?.threadId}\` \`${m?.name}\``)
        }
    });
}

async function execPunishmentSchedule(client, guildID, userID, type) {
    if (!guildID || !userID || !type || !client) throw new TypeError("Undefined param!");
    const USER = await client.users.fetch(userID);
    if (!USER) throw new Error("Unknown user");
    if (!USER.DB) await USER.dbLoad();
    const GUILD = await client.guilds.fetch(guildID);
    if (!GUILD) throw new Error("Unknown guild");
    if (!GUILD.DB) await GUILD.dbLoad();
    const CL = GUILD.member(client.user);
    let ret;
    if (type === "mute") {
        ret = await USER.unmute(GUILD, CL, "Punishment expired");
    } else {
        ret = await USER.unban(GUILD, CL, "Punishment expired");
    }
    return ret;
}

module.exports = { scheduler, execPunishmentSchedule }