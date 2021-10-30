'use strict';

const { PermissionString, CommandInteraction, TextBasedChannels, User, GuildMember, Guild } = require("discord.js");
const ShaClient = require("./ShaClient");
const configFile = require("../../config.json");
const { loadDb } = require("../database");

/**
 * @typedef {object} CommandData
 * @property {string} name
 * @property {string} description
 * @property {boolean} guildOnly
 * @property {boolean} ownerOnly
 * @property {boolean} nsfwOnly
 * @property {boolean} guarded
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
        this.userPermissions = data.userPermissions || [];
        this.clientPermissions = data.clientPermissions || [];
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