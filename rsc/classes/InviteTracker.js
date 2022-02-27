"use strict";

const { loadDb } = require("../database");
const { database } = require("../mongo");
const { ShaBaseDb } = require("./Database");

class InviteTracker {
    /** 
     * @param {import("../typins").ShaGuildMember} member
     * @param {import("discord.js").Invite} invite
    */
    static async join(member, invite) {
        const inviterDb = new ShaBaseDb(database, `member/${member.guild.id}/${invite.inviterId}`);
        const getInviter = await inviterDb.getOne("invites", "Object");
        const o = getInviter?.value || {
            invites: 0,
            left: 0,
        };
        o.invites++;
        inviterDb.set("invites", "Object", { value: o });

        const md = loadDb(member, `member/${member.guild.id}/${member.id}`);
        return md.db.set("inviter", "Object", { value: { inviter: invite.inviterId, code: invite.code } });
    }

    /** @param {import("../typins").ShaGuildMember} member */
    static async left(member) {
        const md = loadDb(member, `member/${member.guild.id}/${member.id}`);
        const inviter = await md.db.getOne("inviter", "Object");
        if (!inviter?.value.inviter) return;
        const inviterDb = new ShaBaseDb(database, `member/${member.guild.id}/${inviter.value.inviter}`);
        const data = await inviterDb.getOne("invites", "Object");
        const o = data?.value || {
            invites: 0,
            left: 0,
        };
        o.left++;
        md.db.delete("inviter", "Object");
        return inviterDb.set("invites", "Object", { value: o });
    }
}

module.exports = { InviteTracker }
