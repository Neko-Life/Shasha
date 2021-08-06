'use strict';

const { Role, Message } = require("discord.js");

const { parseDash, defaultImageEmbed, trySend, getRole, cleanMentionID } = require("../../../resources/functions"),
    fn = require("./duration"),
    ARGS_TEXT = "Args:\n`-r` Role: `role_[name|mention|ID]`,\n`-d` Duration: `[duration]` - Format: `number_[y|mo|w|d|h|m|s]`";

module.exports = (msg, arg) => {
    if (!msg.member.isAdmin) return trySend(msg.client, msg, msg.author + " you're not an Administrator <:nekohmLife:846371737644957786>");
    const args = parseDash(arg);
    let setEmb = defaultImageEmbed(msg, null, "Mute Configuration"),
        MUTE = msg.guild.DB.settings.mute || {},
        duration,
        role,
        resultMsg = "";
    if (!args?.[1]) setEmb.setDescription(ARGS_TEXT); else {
        for (const ARG of args) {
            if (ARG === "-") continue;
            if (ARG.startsWith("r ")) {
                const key = cleanMentionID(ARG.slice(2));
                if (key === "none") {
                    role = false;
                    continue;
                }
                else if (key?.length) role = getRole(msg.guild, key);
                const RP = role?.position;
                const CRP = msg.guild.member(msg.client.user).roles.highest.position;
                if (role && (RP ? RP > CRP : false)) resultMsg += "**[WARNING]** Mute role position is higher than my highest role!\n";
                if (role === undefined) resultMsg += `No role found for: **${ARG}**\n`; else msg.guild.DB.settings.mute.role = role.id;
            }
            if (ARG.startsWith("d ")) {
                const D = ARG.slice(2).trim();
                // console.log(D);
                if (/^[\-\+]?\d{1,16}(?![^ymwdhs])[ymwdhs]?o?/i.test(D)) {
                    duration = fn.duration(msg.createdAt, D);
                    msg.guild.DB.settings.mute.defaultDuration = duration;
                } else resultMsg += "Valid duration format: `number_[y|mo|w|d|h|m|s]`. Example: `69y420w5m72s3mo`";
            }
        }
        MUTE = msg.guild.DB.settings.mute;
        msg.guild.setDb("settings", msg.guild.DB.settings);
    }

    setEmb
        .addField("Role", MUTE.role ? "<@&" + MUTE.role + ">" : "Not set")
        .addField("Duration", MUTE.defaultDuration?.duration?.strings?.join(" ") || "Not set");
    return trySend(msg.client, msg, { content: resultMsg, embed: setEmb });
}