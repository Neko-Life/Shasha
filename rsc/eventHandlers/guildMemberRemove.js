"use strict";

const inviteTracker = require("../handlers/inviteTracker");

/**
 * @param {ShaClient} client
 * @param {GuildMember} member
 */
async function handle(client, member) {
    inviteTracker(member, "left");
}

module.exports = { handle }