'use strict';

const { MessageEmbed } = require("discord.js");
const { Command } = require("../../classes/Command");
const { fetchAllMembers, emphasizePerms } = require("../../functions");
const { getColor } = require("../../functions");
const { intervalToStrings, createInterval } = require("../../util/Duration");

module.exports = class RoleInfoCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "role",
            guildOnly: true
        });
    }

    async run(inter, { role }) {
        await inter.deferReply();
        if (!role)
            role = {
                role: inter.guild.roles.cache.get(inter.guild.id)
            }
        await fetchAllMembers(inter.guild);
        const {
            color,
            hexColor,
            createdAt,
            createdTimestamp,
            hoist,
            id,
            members,
            managed,
            mentionable,
            name,
            permissions,
            position
        } = role.role;
        const perms = [];
        const permData = permissions.serialize();
        if (permData.ADMINISTRATOR) perms.push("'ADMINISTRATOR'");
        else for (const U in permData) {
            if (!permData[U]) continue;
            perms.push(emphasizePerms(U));
        }
        if (!perms.length) perms.push("THIS ROLE IS FOR ANTIQUE PURPOSE ONLY");
        const emb = new MessageEmbed()
            .setTitle(`About Role \`${name}\``)
            .addField("Identifier", `${id === inter.guild.id ? "@everyone" : `<@&${id}>`}\n(${id})`)
            .addField("Created", "<t:" + Math.floor(createdTimestamp / 1000) + ":F>\n"
                + `(${intervalToStrings(
                    createInterval(createdAt, new Date())
                ).strings.join(" ")} ago)`)
            .addField("Managed by Discord", managed ? "`Yes`" : "`No`", true)
            .addField("Hoisted", hoist ? "`Yes`" : "`No`", true)
            .addField("Mentionable", mentionable ? "`Yes`" : "`No`", true)
            .addField("Member with this role", "Found `"
                + members.size
                + "` member"
                + (members.size > 1 ? "s" : ""), true)
            .addField("Position", "`" + position + "`", true)
            .addField("Color", "`" + hexColor + "`\n`" + color + "`", true)
            .addField("Permissions", "```js\n" + (perms.join(", ")) + "```")
            .setColor(getColor(hexColor));
        return inter.editReply({ embeds: [emb] })
    }
}