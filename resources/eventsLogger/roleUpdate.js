'use strict';

const { Role } = require("discord.js");
const { defaultEventLogEmbed, getAudit, trySend } = require("../functions");
const getColor = require("../getColor");

/**
 * @param {Role} oldRole 
 * @param {Role} newRole 
 */
async function run(oldRole, newRole) {
    const dateNow = new Date()
    if (!newRole.guild.DB) await newRole.guild.dbLoad();
    if (!newRole.guild.DB.eventChannels?.role) return;
    const logChannel = newRole.guild.channels.cache.get(newRole.guild.DB.eventChannels.role);
    if (!logChannel) return;
    const emb = defaultEventLogEmbed(newRole.guild)
        .setColor(getColor("blue"));

    if (oldRole.name !== newRole.name) {
        emb.addField("Name", `Changed from \`${oldRole.name}\` to \`${newRole.name}\``);
    };
    if (oldRole.color !== newRole.color) {
        emb.setColor(getColor(oldRole.color));
        emb.addField("Color",
            `Changed from \`${oldRole.hexColor}\` to \`${newRole.hexColor}\`\n` +
            "This embed has the old color. New looks <@&" + newRole.id + ">");
    };
    if (oldRole.hoist !== newRole.hoist) {
        emb.addField("Hoisted", newRole.hoist ? "`Yes`" : "`No`");
    };
    if (oldRole.mentionable !== newRole.mentionable) {
        emb.addField("Mentionable", newRole.mentionable ? "`Yes`" : "`No`");
    };
    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
        const oldSerialized = oldRole.permissions.serialize(),
            newSerialized = newRole.permissions.serialize();
        if (!(oldSerialized.ADMINISTRATOR && newSerialized.ADMINISTRATOR)) {
            let approved = [], denied = [];

            for (const K in newSerialized) {
                if (newSerialized[K] === oldSerialized[K]) continue;
                if (newSerialized[K]) approved.push(K);
                else denied.push(K);
            };

            emb.addField("Permissions",
                (
                    approved.length ?
                        "**Approved:**```js\n" +
                        approved.join(", ") +
                        "```" : ""
                ) +
                (
                    denied.length ?
                        "**Denied:**```js\n" +
                        denied.join(", ") +
                        "```" : ""
                )
            );
        }
    };

    if (!emb.fields.length) return;

    let audit;
    if (newRole.guild.me.hasPermission("VIEW_AUDIT_LOG")) {
        audit = await getAudit(newRole.guild, dateNow, newRole.id, { type: "ROLE_UPDATE" });
    };

    emb.setTitle(`Role \`${newRole.name}\` updated${audit?.executor ?
        ` by ${audit.executor.bot ? "`[BOT]` " : ""
        }\`${audit.executor.tag}\`` : ""}`)
        .addField("Role", "<@&" + newRole.id + ">\n" +
            `(${newRole.id})`, true);
    if (audit?.executor) {
        emb.setAuthor(emb.author.name, audit.executor.displayAvatarURL({ size: 128, format: "png", dynamic: true }))
            .addField("Administrator", `<@${audit.executor.id}>\n(${audit.executor.id})`, true);
    } return trySend(newRole.client, logChannel, emb);
}

module.exports = { run }