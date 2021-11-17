'use strict';

const { PermissionString, CommandInteraction, TextBasedChannels, User, GuildMember, Guild, AutocompleteInteraction, Message } = require("discord.js");
const ShaClient = require("./ShaClient");
const configFile = require("../../config.json");
const { loadDb } = require("../database");
const { escapeRegExp } = require("lodash");
const { isAdmin, allowMention, cleanMentionID } = require("../functions");
const { logDev } = require("../debug");

/**
 * @typedef {object} AutocompleteData
 * @property {{command:{key: string} | {key: {name: string, value: string}}}} commands
 * @property {boolean} matchKey - Match options key, `undefined` by default
 * @property {boolean} matchName - `true` by default
 * @property {boolean} showRecent - `true` by default
 * @property {boolean} preview - `true` by default
 * 
 * 
 * @typedef {object} CommandData
 * @property {string} name
 * @property {string} description
 * @property {boolean} guildOnly
 * @property {boolean} ownerOnly
 * @property {boolean} nsfwOnly
 * @property {boolean} guarded
 * @property {AutocompleteData} autocomplete
 * @property {PermissionString[]} userPermissions
 * @property {PermissionString[]} clientPermissions
 *
 * @typedef {object} allowMentionParam
 * @property {GuildMember} member - Guild Member
 * @property {string} content - String containing mentions
 *
 * @typedef {object} CmdDisableOpt
 * @property {{users: string[], roles: string[], permissions: PermissionString[]}} bypass - Ids to bypass
 * @property {boolean} all - Wether to set for all channels (ignores channels option)
 * @property {string[]} channels - Channel Ids to bypass
 * @property {boolean} remove - Delete the data in db
 */

module.exports.Command = class ShaBaseCommand {
    /**
     * @param {CommandInteraction} interaction
     * @param {CommandData} data
     */
    constructor(interaction, data) {
        if (typeof data.autocomplete !== "object" && data.autocomplete !== undefined && data.autocomplete !== null)
            throw new TypeError("autocomplete must be a type of object, received " + typeof data.autocomplete);
        /**
         * @type {CommandInteraction}
         */
        this.interaction = interaction;
        /**
         * @type {ShaClient}
         */
        this.client = interaction.client;
        /**
         * @type {User}
         */
        this.user = interaction.user;
        /**
         * @type {GuildMember | import("discord-api-types").APIInteractionGuildMember}
         */
        this.member = interaction.member;
        /**
         * @type {Guild}
         */
        this.guild = interaction.guild;
        /**
         * @type {TextBasedChannels}
         */
        this.channel = interaction.channel;
        /**
         * @type {string[]}
         */
        this.commandPath = interaction.commandPath;
        this.name = data.name;
        this.description = data.description;
        this.guildOnly = data.guildOnly || false;
        this.ownerOnly = data.ownerOnly || false;
        this.nsfwOnly = data.nsfwOnly || false;
        this.guarded = data.guarded || false;
        this.bypass = null;
        /**
         * @type {AutocompleteData}
         */
        this.autocomplete = data.autocomplete || {};
        this.userPermissions = data.userPermissions || [];
        this.clientPermissions = data.clientPermissions || [];
    }

    /**
     * 
     * @param {{client:ShaClient, user: User, guild: Guild}} param0 
     * @returns 
     */
    static constructCommandEmoteAutocomplete({ client, user, guild }) {
        if (!client || !user || !guild) return;
        const emoji = {};
        const mutual = client.findMutualGuilds(user);
        for (const [k, v] of client.emojis.cache) {
            let theName;
            if (v.guild.id !== guild.id) {
                const your = mutual.get(v.guild.id);
                if (!your) continue;
                if (your.ownerId === user.id)
                    theName = "In your server: ";
                else theName = "In other server: ";
            } else theName = "In this server: ";
            theName += v.name;
            emoji[`<${v.animated ? "a" : ""}:${v.name}:${v.id}>`] = { name: theName, value: v.id };
        }
        return emoji;
    }

    /**
     * @param {AutocompleteInteraction} inter 
     * @param {import("discord.js").ApplicationCommandOptionChoice} focus
     */
    async handleAutocomplete(inter, focus) {
        logDev(focus);
        logDev(this.autocomplete);
        const toVar = focus.name.split("-");
        let newName = toVar[0] || focus.name;
        if (toVar?.length)
            for (let index = 0; index < toVar.length; index++) {
                if (!index) continue;
                newName = newName + toVar[index][0].toUpperCase() + toVar[index].slice(1);
            }
        focus.name = newName;
        const cmd = this.autocomplete.commands?.[focus.name];

        if (typeof this.autocomplete.preview !== "boolean")
            this.autocomplete.preview = true;
        if (typeof this.autocomplete.showRecent !== "boolean")
            this.autocomplete.showRecent = true;

        const res = [];

        if (cmd) {
            if (!focus.value) {
                if (this.autocomplete.preview)
                    for (const k in cmd) {
                        if (typeof cmd[k] === "function") continue;
                        res.push({
                            name: cmd[k].name || cmd[k],
                            value: cmd[k].value || cmd[k]
                        });
                    }
            } else {
                if (typeof this.autocomplete.matchName !== "boolean")
                    this.autocomplete.matchName = true;
                if (!this.autocomplete.matchName && this.autocomplete.matchKey === undefined)
                    this.autocomplete.matchKey = true;
                const re = new RegExp(escapeRegExp(cleanMentionID(focus.value)), "i");
                for (const k in cmd) {
                    if (typeof cmd[k] === "function") continue;
                    else if (typeof cmd[k] === "object") {
                        if (
                            (
                                this.autocomplete.matchName
                                    ? re.test(cmd[k].name)
                                    : false
                            ) || (
                                this.autocomplete.matchKey
                                    ? re.test(k)
                                    : false
                            )
                        ) res.push(cmd[k]);
                    } else if (
                        (
                            this.autocomplete.matchName
                                ? re.test(cmd[k])
                                : false
                        ) || (
                            this.autocomplete.matchKey
                                ? re.test(k)
                                : false
                        )
                    ) res.push({ name: cmd[k], value: cmd[k] });
                }
            }
        }

        const udb = loadDb(inter.user, "user/" + inter.user.id);
        logDev(udb);
        const dbPath = this.commandPath.join("/");
        if (!this.user.autocomplete) this.user.autocomplete = {};
        const get = this.user.autocomplete[dbPath]
            ? null
            : new Array(...(await udb.db.get("recentAutocomplete", dbPath)));
        const fullVal = this.user.autocomplete[dbPath] || get[0]?.[1].value;
        const val = this.autocomplete.showRecent && !focus.value
            ? fullVal?.[focus.name]
            : null;
        if (val?.length) {
            logDev(val);
            logDev(res);
            res.splice(0, 0, ...val);
            if (!this.user.autocomplete[dbPath]) this.user.autocomplete[dbPath] = {};
            this.user.autocomplete[dbPath][focus.name] = val;
        }
        if (focus.value && !res.length)
            res.push({ name: focus.value, value: focus.value });

        this.user.lastAutocomplete = {
            autocomplete: this.autocomplete,
            commandPath: dbPath,
            db: fullVal
        }
        const toRes = [];
        for (const v of res.filter(r => r.value.length <= 100).slice(0, 25)) {
            v.name = v.name.slice(0, 100);
            toRes.push(v);
        }
        logDev(toRes);
        return inter.respond(toRes);
    }

    /**
     * Check a member if they're administrator, will return string if `member` is User instance, or undefined when error
     * @param {boolean} bypassOwner
     * @returns {boolean | "USER"}
     */
    isAdmin(bypassOwner) {
        return isAdmin(this.member || this.user, bypassOwner);
    }

    /**
     * @param {string} content 
     * @returns {{parse:string[]}}
     */
    allowMention(content) {
        return allowMention({ member: this.member, content });
    }

    get isOwner() {
        return this.client.isOwner(this.user);
    }
    /**
     * Get message object from the message channel or provided channel
     * @param {string} MainID - Message ID | Channel_[mention|ID] | Message link
     * @param {string} SecondID - Message ID
     * @returns {Promise<Message>} Message object | undefined
     */
    async getChannelMessage(MainID, SecondID) {
        if (!MainID) return;
        if (/\//.test(MainID)) {
            const splitURL = MainID.split(/\/+/);
            SecondID = splitURL[splitURL.length - 1];
            MainID = splitURL[splitURL.length - 2];
        }
        MainID = cleanMentionID(MainID);
        if (SecondID && !/\D/.test(SecondID)) {
            try {
                const meschannel = (this.isOwner ? this.client : this.guild).channels.cache.get(MainID);
                return meschannel.messages.fetch(SecondID, true).catch(logDev);
            } catch (e) {
                logDev(e);
                return null;
            }
        } else {
            return this.channel.messages.fetch(MainID, true).catch(logDev);
        }
    }

    /**
     * 
     * @param {string} arg 
     * @param {TextBasedChannels} oldChannel 
     * @returns {Promise<Message>}
     */
    async messageArg(arg, oldChannel) {
        if (!arg) return;
        if (!oldChannel) oldChannel = this.channel;
        let msg;
        if (["l", "last"].includes(arg.toLowerCase()))
            msg = oldChannel.lastMessage;
        else {
            const SP = arg.split(/ +/);
            msg = await this.getChannelMessage(SP[0], SP[1]);
        }
        return msg;
    }

    #disabled = null;

    async disabled() {
        if (typeof this.#disabled === "boolean") return this.#disabled;
        if (!this.guild) return this.#disabled = false;

        const gd = loadDb(this.guild, "guild/" + this.guild.id);
        const setting = await gd.db.getOne("commandDisabled", this.commandPath.join("/"));
        if (!setting) return this.#disabled = false;

        const bypassIds = [];
        this.bypass = false;
        if (setting.bypass.roles?.length) bypassIds.push(...setting.bypass.roles);
        if (setting.bypass.users?.length) bypassIds.push(...setting.bypass.users);
        if (setting.bypass.permissions?.length) bypassIds.push(...setting.bypass.permissions);
        if (bypassIds.length) this.bypass = bypassIds.some(r => {
            let ret = false;
            if (/\D/.test(r)) {
                if (this.member.permissionsIn(this.channel).has(r))
                    ret = true;
            } else {
                if (r === this.user.id) ret = true;
                if (this.member.roles.cache.get(r))
                    ret = true;
            }
            return ret;
        });
        if (setting.all && !this.bypass) return this.#disabled = true;
        if (setting.channels.includes(this.channel.id) && !this.bypass)
            return this.#disabled = true;
        return this.#disabled = false;
    }

    /**
     * @param {CmdDisableOpt} opt
     */
    async setDisabled(opt) {
        let { bypass = {}, all, channels = [], remove = false } = opt;
        if (!remove) {
            if (typeof all !== "boolean")
                if (!channels.length) opt.all = true;
                else opt.all = false;
            opt.channels = channels;
            opt.bypass = bypass;
        }

        const gd = loadDb(this.guild, "guild/" + this.guild.id);
        if (remove) return gd.db.delete("commandDisabled", this.commandPath.join("/"));
        return gd.db.set("commandDisabled", this.commandPath.join("/"), opt);
    }

    async banGuild(guild) {
        if (!guild) guild = this.guild;
        return this.client.banGuild(guild);
    }

    async banUser(user) {
        if (!user) user = this.user;
        return this.client.banUser(user);
    }

    async unbanGuild(guild) {
        if (!guild) guild = this.guild;
        return this.client.unbanGuild(guild);
    }

    async unbanUser(user) {
        if (!user) user = this.user;
        return this.client.unbanUser(user);
    }

    async guildBanned() {
        if (this.guild.id === configFile.home) return false;
        if (this.client.isOwner(this.user)) return false;
        const get = await this.client.loadBannedGuilds();
        if (get.includes(this.guild.id)) return true;
        return false;
    }

    async userBanned() {
        if (this.client.isOwner(this.user)) return false;
        const get = await this.client.loadBannedUsers();
        if (get.includes(this.user.id)) return true;
        return false;
    }
}