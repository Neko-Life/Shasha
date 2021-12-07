const { join } = require("path");
const { Worker } = require("worker_threads");
const { logDev } = require("../debug");

/**
 * 
 * @param {*} client 
 * @param {import("../typins").ShaGuild} guild 
 */
async function handle(client, guild) {
    // const worker = new Worker(join(__dirname, "../../registerCommands.js"), {
    //     argv: ["null", guild.id]
    // });
    // logDev("Registering commands in", guild.name, guild.id);
    // worker.on("message", logDev);
}

module.exports = { handle }