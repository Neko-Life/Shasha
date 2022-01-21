"use strict";

const { InviteTracker } = require("../classes/InviteTracker");
const { cacheGuildInvites } = require("../functions");

/**
 * @param {import("../typins").ShaGuildMember} member
 * @param {"join" | "left"} action
*/
module.exports = async (member, action) => {
    if (!member.guild.invites.cache.size) {
        return cacheGuildInvites(member.guild);
    }
    let incInvite;

    if (action === "join") {
        const oldCache = member.guild.invites.cache.map(r => { return { c: r.code, uses: r.uses } });
        const invitesFetch = await cacheGuildInvites(member.guild, true);
        if (!invitesFetch?.size) return;
        for (const [k, v] of invitesFetch) {
            let old = oldCache.find(r => r.c === k);
            if (!old) old = { uses: 0 };
            if (v.uses <= old.uses) continue;
            incInvite = v;
            break;
        }
        if (!incInvite) return;
    }
    return InviteTracker[action](member, incInvite);
}