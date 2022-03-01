"use strict";

const { MessageEmbed } = require("discord.js");
const ArgsParser = require("../../classes/ArgsParser");
const { Command } = require("../../classes/Command");
const { Lockdown } = require("../../classes/Lockdown");
const { Moderation } = require("../../classes/Moderation");
const { loadDb } = require("../../database");
const { logDev } = require("../../debug");
const { replyError, getColor, unixToSeconds, addS } = require("../../functions");
const { createInterval, intervalToStrings } = require("../../util/Duration");

module.exports = class LockCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "lock",
            guildOnly: true,
            userPermissions: ["ADMINISTRATOR"],
            clientPermissions: ["ADMINISTRATOR"],
        });
    }

    async run(inter, { channels, category, ignoreRoles, ignorePermissions, duration, reason, optimization }) {
        const invoked = new Date();
        await inter.reply("Targeting, please wait...");
        const targets = await getTargets(inter, this.guild, this.channel, channels, category);
        if (!targets) return;
        await inter.editReply(`Locking ${targets.length} channel${addS(targets)}... This message will be edited when done...`)
        const iRoles = ignoreRoles?.value ? await ArgsParser.roles(this.guild, ignoreRoles.value) : null;
        const iPerms = ignorePermissions?.value ? ArgsParser.permissions(ignorePermissions.value) : null;

        const gd = loadDb(this.guild);
        const get = await gd.db.getOne("lockdownSettings", "Object");
        const settings = get?.value;
        let parseD;

        try {
            parseD = Moderation.defaultParseDuration(invoked, duration?.value, settings?.duration, 600000);
        } catch (e) {
            if (e.message === "Duration less than minimum ms")
                return inter.editReply(replyError(e));
        }

        const end = parseD?.end;
        const mod = new Lockdown(targets, this.member, {
            ignores: {
                roles: iRoles?.roles,
                permissions: iPerms?.perms,
            },
            end,
            reason: reason?.value,
            force: optimization?.value === "0",
        });
        let executed;
        try {
            executed = await mod.lock();
        } catch (e) {
            logDev(e);
            return inter.editReply(replyError(e));
        }
        if (!executed.executed.length) return inter.editReply("No permissions to change, it's already locked for them peasants");

        const done = executed.executed.map(r => r.channel.id);
        const alr = executed.already.map(r => r.id);
        let desc = "**Executed**:\n";
        desc += "<#" + done.join(">, <#") + ">";

        if (alr.length) {
            desc += "\n\n**Already locked**:\n";
            desc += "<#" + alr.join(">, <#") + ">";
        }

        if (iRoles?.roles?.length) {
            desc += "\n\n**Ignored roles**:\n";
            desc += "<@&" + iRoles.roles.map(r => r.id).join(">, <@&") + ">";
        }

        if (iPerms?.perms?.length) {
            desc += "\n\n**Ignored permissions**:```\n";
            desc += iPerms.perms.join(", ") + "```";
        }

        const emb = new MessageEmbed()
            .setColor(getColor(this.user.accentColor, true, this.member.displayColor))
            .setTitle("Lock")
            .setDescription(desc.slice(0, 4000))
            .setFooter({ text: `Took ${intervalToStrings(createInterval(invoked, new Date())).strings.join(" ")} to execute ${done.length} channel${addS(done)}` });
        if (reason)
            emb.addField("Reason", reason.value);
        emb.addField("At", "<t:" + unixToSeconds(invoked) + ":F>", true)
            .addField("Until", parseD ? "<t:" + unixToSeconds(end) + ":F>" : "`Never`", true)
            .addField("For", parseD ? "`" + parseD.duration.strings.join(" ") + "`" : "`Ever`");

        return inter.editReply({ embeds: [emb] });
    }
}

/**
 * 
 * @param {*} inter 
 * @param {import("../../typins").ShaGuild} guild 
 * @param {import("../../typins").ShaGuildChannel} defaultChannel 
 * @param {{value:string}} channels 
 * @param {{channel:import("discord.js").CategoryChannel}} category 
 * @param {boolean} all
 * @returns {Promise<import("../../typins").ShaGuildChannel[]>}
 */
async function getTargets(inter, guild, defaultChannel, channels, category, all) {
    let targets;
    const noTargetRet = () => {
        if (targets?.length) return;
        inter.editReply("No text channel to target :/");
        return true;
    }
    if (channels) {
        const parse = await ArgsParser.channels(guild, all ? channels.value.replace("all", " " + guild.channels.cache.map(r => r.id).join(" ") + " ") : channels.value);
        targets = parse.channels.filter(r => r.isText?.() && !r.isThread?.());
        if (noTargetRet()) return;
    } else if (category) {
        targets = category.channel.children.filter(r => r.isText?.() && !r.isThread?.()).map(r => r);
        if (noTargetRet()) return;
    } else targets = [defaultChannel];
    return targets;
}

module.exports.getTargets = getTargets;
