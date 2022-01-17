"use strict";

const { InviteTracker } = require("../classes/InviteTracker");

/**
 * @param {import("../typins").ShaGuildMember} member
 * @param {"join" | "left"} action
*/
module.exports = async (member, action) => {
    let incInvite;

    if (action === "join") {
        const perm = member.guild.me.permissions;
        if (!member.guild.invites.cache.size) {
            if (perm.has("ADMINISTRATOR") || perm.has("MANAGE_GUILD")) {
                return member.guild.invites.fetch();
            }
            return;
        }
        const oldCache = member.guild.invites.cache.map(r => { return { c: r.code, uses: r.uses } });
        let invitesFetch;
        if (perm.has("ADMINISTRATOR") || perm.has("MANAGE_GUILD")) {
            new Promise(
                (r, j) => setTimeout(
                    () => {
                        if (invitesFetch !== undefined) r();
                        else j(new Error(`Can't fetch invites, possible stuck: \`${member.guild.name}\` (${member.guild.id})`));
                    },
                    10000
                )
            );
            invitesFetch = await member.guild.invites.fetch();
        }
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