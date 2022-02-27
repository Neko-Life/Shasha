"use strict";

const { GuildMember } = require("discord.js");
const { Moderation } = require("../classes/Moderation");
const ShaClient = require("../classes/ShaClient");
const { loadDb } = require("../database");
const { logDev } = require("../debug");
const { wait } = require("../functions");
const inviteTracker = require("../handlers/inviteTracker");

/**
 * @param {ShaClient} client
 * @param {GuildMember} member
 */
async function handle(client, member) {
    const md = loadDb(member, "member/" + member.guild.id + "/" + member.id);
    const getMutedData = await md.db.getOne("muted", "Object");
    const mutedData = getMutedData?.value || {};
    if (mutedData.state) {
        wait(3000).then(() =>
            new Moderation(member.client, {
                guild: member.guild,
                targets: member,
                moderator: member.guild.me
            }).mute({
                invoked: new Date(),
                end: mutedData.end,
                muteRole: mutedData.muteRole,
                reason: "Left and rejoined while muted"
            }).catch(logDev)
        );
    } else if (mutedData.takenRoles?.length) {
        wait(3000).then(() =>
            new Moderation(member.client, {
                guild: member.guild,
                targets: member,
                moderator: member.guild.me
            }).unmute({
                invoked: new Date(),
                notify: false,
                reason: "Punishment expired"
            }).catch(logDev)
        );
    }
    inviteTracker(member, "join");
    console;
}

module.exports = { handle }
