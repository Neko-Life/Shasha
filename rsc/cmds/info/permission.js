'use strict';

const { MessageEmbed, GuildMember, Role, User } = require("discord.js");
const { Command } = require("../../classes/Command");
const { tickTag, emphasizePerms } = require("../../functions");
const getColor = require("../../getColor");

module.exports = class PermCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "permission",
            clientPermissions: ["EMBED_LINKS"]
        });
    }

    async run(inter, { permissionFor, channel }) {
        await inter.deferReply();
        let pFor;
        if (permissionFor) {
            if (permissionFor.user) pFor = permissionFor.member || permissionFor.user;
            else pFor = permissionFor.role;
        } else pFor = inter.member;
        const serial = pFor.permissions?.serialize();
        const defPerms = [];
        const chaPerms = [];
        if (serial?.ADMINISTRATOR) defPerms.push("'ADMINISTRATOR'");
        else if (serial) for (const P in serial) {
            if (!serial[P]) continue;
            defPerms.push(emphasizePerms(P));
        }
        if (!defPerms.length) defPerms.push("NONE LMFAOOO SADGEE");
        if (channel?.channel) {
            const serial = channel.channel.permissionsFor(pFor)?.serialize();
            if (serial) {
                if (serial.ADMINISTRATOR) chaPerms.push("'ADMINISTRATOR'");
                else if (serial.VIEW_CHANNEL) for (const P in serial) {
                    if (!serial[P]) continue;
                    chaPerms.push(emphasizePerms(P));
                }
            }
            if (!chaPerms.length) chaPerms.push("GET REKTT AHAUHUHE NO PERMSS");
        }
        let res = "```js\n" + defPerms.join(", ") + "```";
        if (chaPerms.length) res += "\nIn **"
            + channel.channel.name + "**:```js\n"
            + chaPerms.join(", ") + "```";
        const emb = new MessageEmbed()
            .setDescription(res)
            .setColor(getColor(pFor.displayColor || pFor.color));
        let type;
        if (pFor instanceof GuildMember) {
            emb.setThumbnail(pFor.user.displayAvatarURL({ size: 4096, format: "png", dynamic: true }));
            type = "Member **" + pFor.displayName + `** (${tickTag(pFor.user)})`;
        }
        else if (pFor instanceof Role) type = "Role **" + pFor.name + "**";
        else if (pFor instanceof User) {
            emb.setThumbnail(pFor.displayAvatarURL({ size: 4096, format: "png", dynamic: true }));
            type = "User " + tickTag(pFor);
        }
        emb.setTitle("Permissions For " + type);
        return inter.editReply({ embeds: [emb] });
    }
}