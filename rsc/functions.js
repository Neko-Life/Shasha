'use strict';

const { CommandInteraction, MessageEmbed, Client, Collection, Guild, User, Interaction, GuildMember, Invite, Role, GuildChannel } = require("discord.js");
const { escapeRegExp } = require("lodash");
const { database } = require("./mongo");
const { randomColors } = require("../config.json");
const { ShaBaseDb } = require("./classes/Database");

// ---------------- CONSTANTS ----------------

const ePerms = [
    "KICK_MEMBERS",
    "BAN_MEMBERS",
    "MANAGE_CHANNELS",
    "MANAGE_GUILD",
    "VIEW_AUDIT_LOG",
    "MANAGE_MESSAGES",
    "MENTION_EVERYONE",
    "VIEW_GUILD_INSIGHTS",
    "MUTE_MEMBERS",
    "DEAFEN_MEMBERS",
    "MOVE_MEMBERS",
    "MANAGE_NICKNAMES",
    "MANAGE_ROLES",
    "MANAGE_WEBHOOKS",
    "MANAGE_EMOJIS_AND_STICKERS",
    "MANAGE_THREADS"
];

const reValidURL = /^https?:\/\/[^\s\n]+\.[^\s\n][^\s\n]/;
const reParseQuote = /(?<!".+)'.+'(?!.+")|(?<!'.+)".+"(?!.+')/g;

// ---------------- FUNCTIONS ----------------

/**
 * Command usage logger
 * @param {Message} msg
 * @param {string} addition 
 */
async function ranLog(msg, addition) {
    if (addition && typeof addition !== "string") return console.error(`[RANLOG] Not a string:`, addition);
    const channel = msg.client.channels.cache.get(ranLogger),
        ifCode = addition?.startsWith("```") && addition.endsWith("```");
    const addSplit = splitOnLength((addition?.substr(ifCode ? 2045 : 2049)).split(","), 1010, ",");
    const embed = defaultImageEmbed(msg, null, msg.command.name.toLocaleUpperCase() + ` ${msg.id}`);
    embed.setAuthor(msg.author.tag + ` (${msg.author.id})`, msg.author.displayAvatarURL({ format: "png", size: 128, dynamic: true }))
        .setURL(msg.url);
    if (addition && addition.length > 0) embed.setDescription(addition.slice(0, ifCode && addSplit[0]?.[0].length > 0 ? 2044 : 2048) + (ifCode && addSplit[0]?.[0].length > 0 ? "```" : ""));
    if (addSplit[0]?.[0].length > 0) for (const add of addSplit) embed.addField("​", "```js\n" + add.join(",") + (embed.fields.length < (addSplit.length - 1) ? ",```" : ""));
    embed.setFooter(timestampAt(msg.client), msg.guild?.iconURL({ format: "png", size: 128, dynamic: true }));
    if (msg.guild) embed.addField("Guild", `\`${msg.guild.name}\`\n(${msg.guild.id})`, true);
    embed.addField("Channel", (msg.guild ? `<#${msg.channel.id}>\n\`${msg.channel.name}\`` : `**DM**\n\`${msg.channel.recipient.tag}\``) + `\n(${msg.channel.id})`, true)
        .addField("User", `<@!${msg.author.id}>`, true);
    trySend(msg.client, channel, { embed: embed });
}

/**
 * Split on Length
 * @param {Array<String>} arr Array of words
 * @param {number} maxLength - Max character length per split
 * @param {string} joiner
 * @returns {Array<String[]>}
 */
function splitOnLength(arr, maxLength, joiner = "\n") {
    let toField = [], i = 0, pushed = 0;
    for (const res of arr) {
        if (
            arr[pushed] &&
            (
                (
                    toField[i] ?
                        toField[i].join(joiner) :
                        ""
                ) +
                joiner +
                arr[pushed]
            ).length > maxLength
        ) i++; else pushed++;

        if (!toField[i] || toField[i].length === 0)
            toField[i] = [];

        toField[i].push(res);

        if (!arr[pushed]) break;
    }
    return toField;
}

function footerColorEmbed(member) {
    const footerQuote = (member.guild.DB || member.user.DB).defaultEmbed?.footerQuote || "";
    const emb = new MessageEmbed()
        .setColor(member ? getColor(member.displayColor) : randomColors[Math.floor(Math.random() * randomColors.length)])
        .setFooter(footerQuote);
    return emb;
}

/**
 * Send message
 * @param {Client} client - (this.client)
 * @param {Message | String | TextChannel | DMChannel} msgOrChannel Message object | channel_ID
 * @param {MessageOptions} content - ({content:content,optionblabla})
 * @param {boolean} checkAd - Check source for Discord invite link (true)
 * @returns {Promise<Message>} Sent message object
 */
async function trySend(client, msgOrChannel, content, checkAd = true) {
    /*if (content instanceof MessageEmbed) {
      let fLength = [];
      for (const f of content.fields) fLength.push(f.value.length);
      console.log("Embed", content.title, timestampAt(client), "\n", content.description, content.description?.length, "\n", content.fields, fLength)
    }*/
    if (!client || !msgOrChannel || !content) return;
    if (typeof msgOrChannel === "string") msgOrChannel = client.channels.cache.get(msgOrChannel);
    if (!client.user.typingIn(msgOrChannel.channel || msgOrChannel))
        (msgOrChannel.channel || msgOrChannel).startTyping();
    if (client.owners.includes(msgOrChannel.author)) {
        checkAd = false;
        if (content.disableMentions) content.disableMentions = "none";
    }
    if (checkAd) {
        if (content.content) {
            content.content = adCheck(content.content);
        } else {
            if (typeof content === "string") content = adCheck(content);
        }
    }
    if (!((msgOrChannel instanceof Message) || (msgOrChannel instanceof TextChannel) || (msgOrChannel instanceof DMChannel))) return errLog(e, null, client, false, "[TRYSEND] Invalid {msgOrChannel} type.```js\n" + JSON.stringify(msgOrChannel, (k, v) => v || undefined, 2) + "```");
    let ret = await (msgOrChannel.channel || msgOrChannel).send(content).catch(/*msgOrChannel.channel ? noPerm(msgOrChannel) :*/ e => errLog(e, msgOrChannel, client));
    if (ret?.[0] instanceof Message) {
        // console.log(ret, typeof ret);
        ret = ret[0];
    }
    await (msgOrChannel.channel || msgOrChannel).stopTyping();
    setTimeout(async () => {
        if (client.user.typingIn(msgOrChannel.channel || msgOrChannel)) {
            await (msgOrChannel.channel || msgOrChannel).stopTyping();
        }
    }, 2000);
    setTimeout(async () => {
        if (client.user.typingIn(msgOrChannel.channel || msgOrChannel))
            await (msgOrChannel.channel || msgOrChannel).stopTyping();
    }, 5000);
    return ret;
}

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
 * @param {Message | Interaction} msg - Message object (msg)
 * @param {string} MainID - Message ID | Channel_[mention|ID] | Message link
 * @param {string} SecondID - Message ID
 * @returns {Promise<Message>} Message object | undefined
 */
async function getChannelMessage(msg, MainID, SecondID) {
    if (!MainID || !msg) return;
    if (/\//.test(MainID)) {
        const splitURL = MainID.split(/\/+/);
        SecondID = splitURL[splitURL.length - 1];
        MainID = splitURL[splitURL.length - 2];
    }
    MainID = cleanMentionID(MainID);
    if (SecondID && !/\D/.test(SecondID)) {
        try {
            const meschannel = (msg.client.owners.map(r => r.id).includes(msg.author?.id || msg.user?.id || msg.id) ? msg.client : msg.guild).channels.cache.get(MainID);
            return meschannel.messages.fetch(SecondID, true).catch(() => { });
        } catch {
            return;
        }
    } else {
        return msg.channel.messages.fetch(MainID, true).catch(() => { });
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
 * @returns 
 */
function createRegExp(pattern, flags) {
    try {
        return new RegExp(pattern, flags);
    } catch {
        return new RegExp(escapeRegExp(pattern), flags);
    }
}

function tickTag(user) {
    return `${user.bot ? "`BOT` " : ""}\`${user.tag}\``;
}

/**
 * Check message's str for ads
 * @param {string} str - String to check
 * @returns {string} Cleaned str
 */
function adCheck(str) {
    if (str?.length > 8) {
        if (/(https:\/\/)?(www\.)?discord\.gg\/(?:\w{2,15}(?!\w)(?= *))/.test(str)) str = str
            .replace(/(https:\/\/)?(www\.)?discord\.gg\/(?:\w{2,15}(?!\w)(?= *))/g,
                '`Some invite link goes here`');
    }
    return str;
}

/**
 * Check a member if they're administrator, will return string if `member` is User instance, or undefined when error
 * @param {GuildMember | User} member 
 * @returns {boolean | "USER"}
 */
function isAdmin(member) {
    if (member instanceof User)
        return "USER";
    try {
        return member.permissions.serialize().ADMINISTRATOR;
    } catch {
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
function maxLengthPad(arrStr) {
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
    if (interaction.message.interaction.user.id !== interaction.user.id) {
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
    if (typeof val !== "number") throw new TypeError("val is " + (typeof val));
    return Math.floor(val / 1000);
}

/**
 * Put single quote on perm string to put on js codeblock to emphasize it
 * @param {import("discord.js").PermissionString} str 
 * @returns {string}
 */
function emphasizePerms(str) { return ePerms.includes(str) ? "'" + str + "'" : str }

/**
 * @typedef {object} allowMentionParam
 * @property {GuildMember} member - Guild Member
 * @property {string} content - String containing mentions
 *
 * @param {allowMentionParam} param0 
 * @returns {object}
 */
function allowMention({ member, content }) {
    const allowedMentions = {};
    if (member && !member.permissions.has("MENTION_EVERYONE")) {
        if (content?.match(/<@\!?[^&]\d{18,20}>/g)?.length > 1)
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
                ? (await guild.invites.fetch({ channelId: guild.rulesChannel.id }).catch(() => { }))
                    ?.filter(
                        r => r.inviter.id === guild.client.user.id
                    )?.first()
                : null
        ) || (
            guild.me.permissionsIn(guild.rulesChannel).has("CREATE_INSTANT_INVITE")
                ? (await guild.invites.create(guild.rulesChannel).catch(() => { }))
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
    if (/^\d{18,20}$/.test(query)) {
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
    if (/^\d{18,20}$/.test(query)) {
        const ch = guild.channels.resolve(query);
        if (!ch && force) return guild.client.channels.resolve(query);
        return ch;
    } else {
        const re = createRegExp(query, reFlags);
        const ch = guild.channels.cache.filter(v =>
            re.test(v.name)
        );
        if (ch.size) return ch;
        if (force) return guild.client.channels.cache.filter(v =>
            re.test(v.name)
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
    if (/^\d{18,20}$/.test(query)) return guild.members.resolve(query);
    else {
        const re = createRegExp(query, reFlags);
        return guild.members.cache.filter(r =>
            re.test(r.nickname) || re.test(r.user.username) || re.test(r.user.tag));
    }
}

// ---------------- DATABASES ----------------

/**
 * 
 * @param {*} instance 
 * @param {import("./classes/Database").ShaDbCollectionType} collection 
 * @returns
 */
function loadDb(instance, collection) {
    if (!instance) throw new TypeError("instance is undefined!");
    if (instance.db) return instance;
    if (!collection) throw new Error("collection isn't specified!");
    instance.db = new ShaBaseDb(database, collection);
    return instance;
}

/**
 * @typedef {object} AddUserExpOpt
 * @property {number} maxRandom - Max random value
 * @property {number} minRandom - Min random value
 * @property {"floor"|"ceil"} round - Round maxRandom result
 * @property {number} divide - Divide rounded maxRandom result
 * @property {number} add - Value to add
 * 
 * @param {User} user 
 * @param {AddUserExpOpt} opt
 * @returns 
 */
async function addUserExp(user, opt = {}) {
    loadDb(user, "user/" + user.id);
    const data = await user.db.getOne("exp", "Number");
    let exp = data?.value;
    if (!exp) exp = 0;
    if (typeof exp !== "number")
        throw new TypeError("exp isn't number. Somethin's wrong in your codes");
    let add;
    if (opt.maxRandom) {
        if (typeof opt.minRandom !== "number") opt.minRandom = 0;
        add = Math.random() * (opt.maxRandom - opt.minRandom) + opt.minRandom;
        if (["floor", "ceil"].includes(opt.round))
            add = Math[opt.round](add);
        if (opt.divide)
            add = add / opt.divide;
    }
    if (opt.add)
        exp += opt.add;
    if (typeof add !== "number") add = 0;
    exp += add;
    if (typeof exp !== "number") throw new TypeError("exp isn't a number");
    return user.db.set("exp", "Number", { value: exp });
}

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
    trySend,
    fetchAllMembers,
    maxLengthPad,
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

    // ---------------- DATABASES ----------------
    // Databases related functions

    loadDb,
    addUserExp
}

module.exports.constants = {
    ePerms,
    reValidURL,
    reParseQuote
}
