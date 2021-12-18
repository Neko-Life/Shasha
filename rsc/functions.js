'use strict';

const { Collection, Guild, User, Interaction, GuildMember, Invite, Role, GuildChannel, MessageActionRow, MessageButton } = require("discord.js");
const { escapeRegExp } = require("lodash");
const { join } = require("path");
const { Worker } = require("worker_threads");
const { PERMISSIONS_EMPHASIZE, REPLY_ERROR } = require("./constants");
const { logDev } = require("./debug");

// ---------------- FUNCTIONS ----------------

/**
 * Parse string (split ",")
 * @param {string} str
 * @returns {String[]}
 */
function parseComa(str) {
    if (!str) return;
    return str.split(/(?<!\\),+(?!\d*})/);
}

/**
 * Get message object from the message channel or provided channel
 * @param {import("./typins").ShaMessage | Interaction} msg - Message object (msg)
 * @param {string} MainID - Message ID | Channel_[mention|ID] | Message link
 * @param {string} SecondID - Message ID
 * @param {boolean} bypass - Bypass to use all client visible channels
 * @returns {Promise<import("./typins").ShaMessage>} Message object | undefined
 */
async function getChannelMessage(msg, MainID, SecondID, bypass) {
    if (!MainID || !msg) return;
    if (/\//.test(MainID)) {
        const splitURL = MainID.split(/\/+/);
        SecondID = splitURL[splitURL.length - 1];
        MainID = splitURL[splitURL.length - 2];
    }
    MainID = cleanMentionID(MainID);
    if (SecondID && !/\D/.test(SecondID)) {
        try {
            const meschannel = ((bypass || msg.client.isOwner(msg.author || msg.user)) ? msg.client : msg.guild)?.channels.cache.get(MainID);
            if (meschannel && meschannel.guild && !meschannel.permissionsFor(msg.client.user).has("VIEW_CHANNEL"))
                return meschannel.messages.cache.get(SecondID);
            return meschannel?.messages.cache.get(SecondID) || meschannel?.messages.fetch(SecondID, true).catch(logDev);
        } catch (e) {
            logDev(e);
            return null;
        }
    } else {
        return msg.channel.messages.cache.get(MainID) || msg.channel.messages.fetch(MainID, true).catch(logDev);
    }
}

/**
 * Return clean ID of provided key
 * @param {string} key - Mention | Channel Name | Username | Rolename
 * @returns {string} Clean ID
 */
function cleanMentionID(key) {
    if (!key || (typeof key !== "string")) return;
    let uID = key.trim();
    if (!/\D/.test(uID)) return uID;
    if (uID.startsWith('<@') || uID.startsWith('<#')) uID = uID.slice(2);
    if (uID.endsWith('>')) uID = uID.slice(0, -1);
    if (uID.startsWith('!') || uID.startsWith("@") || uID.startsWith("#") || uID.startsWith('&')) uID = uID.slice(1);
    return uID;
}

/**
 * Create RegExp, invalid symbols will be escaped if any making it an exact match
 * @param {string} pattern 
 * @param {string} flags 
 * @param {boolean} exact
 * @returns 
 */
function createRegExp(pattern, flags, exact) {
    try {
        return new RegExp(exact ? escapeRegExp(pattern) : pattern, flags);
    } catch (e) {
        logDev(e);
        return new RegExp(escapeRegExp(pattern), flags);
    }
}

/**
 * Was originally for user tick tag and bot. Use for anything that has user property
 * Can be used for string as well
 * @param {User | GuildMember | string} user
 * @returns {string} Ticked string
 */
function tickTag(user) {
    if (user.user) user = user.user;
    return `${user.bot ? "`BOT` " : ""}\`${user.tag || user}\``;
}

/**
 * Check message's str for ads
 * @param {string} str - String to check
 * @returns {string} Cleaned str
 */
function adCheck(str) {
    str = str.replace(/\[(?=((?:.|\n)+?)\][\s\n]*\(\s*[^\n\s]+\s*\))|\](?=[\s\n]*\(\s*[^\n\s]+\s*\))/g, "");
    if (str?.length > 8) {
        if (/(?:https?:\/\/)?(?:www\.|canary\.|ptb\.)?discord(?:app)?\.(?:gg|com)\/(?!channels|attachments)(?:\w{2,17}(?!\w)(?= *))/.test(str)) str = str
            .replace(/(?:https?:\/\/)?(?:www\.|canary\.|ptb\.)?discord(?:app)?\.(?:gg|com)\/(?!channels|attachments)(?:\w{2,17}(?!\w)(?= *))/g,
                '`[BAD_LINK]`');
    }
    return str;
}

/**
 * Check a member if they're administrator, will return string if `member` is User instance, or undefined when error
 * @param {GuildMember | User} member 
 * @param {boolean} bypassOwner
 * @returns {boolean | "USER"}
 */
function isAdmin(member, bypassOwner) {
    if (bypassOwner)
        if (member.client.isOwner(member))
            return true;
    if (member instanceof User)
        return "USER";
    try {
        return member.permissions.serialize().ADMINISTRATOR;
    } catch (e) {
        logDev(e);
        return;
    }
}

async function fetchAllMembers(guild) {
    if (!(guild instanceof Guild)) throw new TypeError("guild isn't instance of Guild");
    if (guild.members.cache.size !== guild.memberCount) await guild.members.fetch();
}

/**
 * Get the longest string length in strings array
 * @param {string[]} arrStr
 * @returns {number}
 */
function maxStringsLength(arrStr) {
    let max = 0;
    if (!Array.isArray(arrStr)) throw new TypeError("arrStr isn't array!");
    for (const A of arrStr) {
        if (typeof A !== "string") throw new TypeError("str isn't string!");
        if (A.length > max) max = A.length;
    }
    return max;
}

/**
 * Used for non-command interaction to check invoker for user specified handling
 * @param {Interaction} interaction
 * @returns {boolean}
 */
function isInteractionInvoker(interaction) {
    let inter;
    if (interaction.message.reference?.messageId) {
        inter = interaction.channel.messages.resolve(interaction.message.reference.messageId).interaction;
    } else inter = interaction.message.interaction;
    if (inter?.user.id !== interaction.user.id) {
        return false;
    } else return true;
}

async function replyFalseInvoker(interaction, cmdName = "the command") {
    return interaction.reply({
        content: "Run `" + cmdName + "` to create your own session",
        ephemeral: true
    });
}

function strYesNo(bool) {
    return bool ? "`Yes`" : "`No`";
}

/**
 * Convert unix timestamp to seconds timestamp
 * @param {Date | number} val
 * @returns {number}
 */
function unixToSeconds(val) {
    if (val instanceof Date) val = val.valueOf();
    if (typeof val !== "number") throw new TypeError("val is " + typeof val);
    return Math.floor(val / 1000);
}

/**
 * Put single quote on perm string to put on js codeblock to emphasize it
 * @param {import("discord.js").PermissionString} str 
 * @returns {string}
 */
function emphasizePerms(str) { return PERMISSIONS_EMPHASIZE.includes(str) ? "'" + str + "'" : str }

/**
 * @param {import("./classes/Command").allowMentionParam} param0 
 * @returns {{parse:string[]}}
 */
function allowMention({ member, content }) {
    const allowedMentions = {};
    if (member && !member.permissions.has("MENTION_EVERYONE")) {
        if (content?.match(/<@\!?[^&]\d{17,20}>/g)?.length > 1)
            allowedMentions.parse = [];
        else allowedMentions.parse = ["users"];
    } else allowedMentions.parse = ["everyone", "roles", "users"];
    return allowedMentions;
}

/**
 * Create/get invite from the rules channel of a community guild
 * @param {Guild} guild
 * @returns {Promise<Invite>}
 */
async function getCommunityInvite(guild) {
    return guild.features.includes("COMMUNITY") && guild.rulesChannel
        ? (
            guild.me.permissionsIn(guild.rulesChannel).has("MANAGE_CHANNELS")
                ? (await guild.invites.fetch({ channelId: guild.rulesChannel.id }).catch(logDev))
                    ?.filter(
                        r => r.inviter.id === guild.client.user.id
                    )?.first()
                : null
        ) || (
            guild.me.permissionsIn(guild.rulesChannel).has("CREATE_INSTANT_INVITE")
                ? (await guild.invites.create(guild.rulesChannel).catch(logDev))
                : null
        ) : null
}

/**
 * 
 * @param {number} ms - Wait for ms
 * @returns 
 */
async function wait(ms) {
    return new Promise((r, j) => setTimeout(r, ms));
}

/**
 * 
 * @param {Guild} guild 
 * @param {string} query 
 * @param {string} reFlags 
 * @returns {Collection<string, Role> | Role}
 */
function findRoles(guild, query, reFlags) {
    if (typeof query !== "string") throw new TypeError("query must be a string!");
    query = cleanMentionID(query);
    if (!query) return;
    if (/^\d{17,20}$/.test(query)) {
        return guild.roles.resolve(query);
    } else {
        const re = createRegExp(query, reFlags);
        return guild.roles.cache.filter(r => re.test(r.name));
    }
}

/**
 * Find channel with id or name, force will use RegExp
 * @param {Guild} guild - Guild to find in
 * @param {string} query
 * @param {string} reFlags - RegExp flags (force)
 * @param {boolean} force
 * @returns {Collection<string, GuildChannel> | GuildChannel}
 */
function findChannels(guild, query, reFlags, force = false) {
    if (typeof query !== "string") throw new TypeError("query must be a string!");
    query = cleanMentionID(query);
    if (!query) return;
    if (/^\d{17,20}$/.test(query)) {
        const ch = guild.channels.resolve(query);
        if (!ch && force) return guild.client.channels.resolve(query);
        return ch;
    } else {
        const re = createRegExp(query, reFlags);
        const ch = guild.channels.cache.filter(
            v => re.test(v.name)
        );
        if (ch.size) return ch;
        if (force) return guild.client.channels.cache.filter(
            v => re.test(v.name)
        );
        return ch;
    }
}

/**
 * 
 * @param {Guild} guild 
 * @param {string} query 
 * @param {string} reFlags 
 * @returns {Collection<string, GuildMember> | GuildMember}
 */
function findMembers(guild, query, reFlags) {
    if (typeof query !== "string") throw new TypeError("query must be a string!");
    query = cleanMentionID(query);
    if (!query) return;
    if (/^\d{17,20}$/.test(query)) return guild.members.resolve(query);
    else {
        const re = createRegExp(query, reFlags);
        return guild.members.cache.filter(r =>
            re.test(r.nickname) || re.test(r.user.username) || re.test(r.user.tag));
    }
}

/**
 * 
 * @param {string} str 
 * @param {number} pad 
 * @returns {string}
 */
function tickPadEnd(str, pad = 0) {
    return "`" + str.toString().padEnd(pad, " ") + "`";
}

/**
 * 
 * @param {string} str - String containing template literals
 * @param {object} vars - Provided variables
 * @returns {string} str
 */
function replaceVars(str, vars = {}) {
    const toEval = str.match(/(?<!\\)(?<=\$\{).+(?=\})/g);
    if (toEval?.length) {
        const rep = [];
        const varsN = Object.keys(vars);
        for (const k of toEval) {
            const data = { match: k };
            data.value = eval("const {" + varsN.join() + "} = vars;" + k);
            rep.push(data);
        }
        for (const k of rep)
            str = str.replace(new RegExp("(?<!\\\\)\\$\\{" + escapeRegExp(k.match) + "\\}"), k.value);
    }
    return str;
}

/**
 * @template T
 * @param {T} o 
 * @param {Array<keyof T>} ignores 
 * @param {PropertyDescriptor} descriptor 
 * @returns {T}
 */
function copyProps(o, ignores = [], descriptor = { enumerable: true }) {
    const R = Object.create(o);
    const no = {};
    for (const k in o)
        if (ignores.includes(k)) continue;
        else no[k] = {
            value: o[k] ?? null,
            ...descriptor
        };
    Object.defineProperties(R, no);
    return R;
}

/**
 * 
 * @param {import("./typins").ShaMessage} message 
 * @returns 
 */
async function disableMessageComponents(message) {
    if (!message) throw new TypeError("message undefined");
    if (!message.editable)
        throw new Error("Can't edit message");

    const R = copyProps(message, ["stickers", "nonce"]);
    for (const I of R.components)
        for (const K of I.components)
            K.setDisabled(true);
    return message.edit(R);
}

function prevNextButton(homeButton) {
    const ret = new MessageActionRow()
        .addComponents(
            new MessageButton().setCustomId("page/prev").setEmoji("⬅️").setStyle("PRIMARY")
        );
    if (homeButton)
        ret.addComponents(new MessageButton().setCustomId("page/home").setEmoji("🏠").setStyle("PRIMARY"))
    ret.addComponents(new MessageButton().setCustomId("page/next").setEmoji("➡️").setStyle("PRIMARY"));
    return ret;
}

/**
 * 
 * @param {typeof Error | {message: string}} e 
 * @param {object} vars 
 * @returns 
 */
function replyError(e, vars) {
    let reply = replaceVars(REPLY_ERROR[e.message] || e.message, vars);
    if (!REPLY_ERROR[e.message])
        emitShaError(e);
    return reply;
}

function replyHigherThanMod(inter, action, { higherThanClient, higherThanModerator }) {
    if (higherThanClient.length) {
        return inter[(inter.deferred || inter.replied) ? "editReply" : "reply"](`Can't ${action} someone in the same or higher position than me`);
    } else if (higherThanModerator.length) {
        return inter[(inter.deferred || inter.replied) ? "editReply" : "reply"](`You can't ${action} someone in the same or higher position than you`);
    } else return false;
}

function emitShaError(e) {
    process.emit("error", e);
}
/** @param {import("./classes/ShaClient")} client */
// async function reRegisterAll(client) {
//     for (const [k, v] of client.guilds.cache) {
//         // const worker = new Worker(join(__dirname, "../registerCommands.js"), {
//         //     argv: ["null", v.id]
//         // });
//         // logDev("Re-registering in", v.name, v.id);
//         // worker.on("message", logDev);
//         v.commands.set([]);
//     }
// }

// ---------------- FNS IMPORTS ----------------

const getColor = require("./util/getColor");

module.exports = {
    // ---------------- FUNCTIONS ---------------- 
    // Essentials for bot functionality

    parseComa,
    getChannelMessage,
    cleanMentionID,
    createRegExp,
    tickTag,
    adCheck,
    isAdmin,
    fetchAllMembers,
    maxStringsLength,
    isInteractionInvoker,
    replyFalseInvoker,
    strYesNo,
    unixToSeconds,
    emphasizePerms,
    allowMention,
    getCommunityInvite,
    wait,
    findRoles,
    findChannels,
    findMembers,
    tickPadEnd,
    replaceVars,
    copyProps,
    disableMessageComponents,
    prevNextButton,
    replyError,
    replyHigherThanMod,
    emitShaError,
    // reRegisterAll,

    // ---------------- FNS IMPORTS ----------------
    // Functions too big to be put here so imported and has its own file instead

    getColor
}