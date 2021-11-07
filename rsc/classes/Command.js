'use strict';

const { PermissionString, CommandInteraction, TextBasedChannels, User, GuildMember, Guild, AutocompleteInteraction } = require("discord.js");
const ShaClient = require("./ShaClient");
const configFile = require("../../config.json");
const { loadDb } = require("../database");
const { escapeRegExp } = require("lodash");

/**
 * @typedef {object} AutocompleteData
 * @property {{command:{key: string} | {key: {name: string, value: string}}}} commands
 * @property {boolean} matchKey - Match options key
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
     * @param {AutocompleteInteraction} inter 
     * @param {import("discord.js").ApplicationCommandOptionChoice | string | number} focus
     */
    handleAutocomplete(inter, focus) {
        const cmd = this.autocomplete.commands?.[focus?.name || focus];
        if (!cmd) return;
        const res = [];

        if (!focus.value) {
            for (const k in cmd) {
                if (typeof cmd[k] === "function") continue;
                res.push({
                    name: cmd[k].name || cmd[k],
                    value: cmd[k].value || cmd[k]
                });
            }
        } else {
            const re = new RegExp(escapeRegExp(focus.value), "i");
            for (const k in cmd) {
                if (typeof cmd[k] === "function") continue;
                else if (typeof cmd[k] === "object") {
                    if (re.test(cmd[k].name) || (this.autocomplete.matchKey ? re.test(k) : false))
                        res.push(cmd[k]);
                } else if (re.test(cmd[k]) || (this.autocomplete.matchKey ? re.test(k) : false))
                    res.push({ name: cmd[k], value: cmd[k] });
            }
        }

        return inter.respond(res.slice(0, 25));
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