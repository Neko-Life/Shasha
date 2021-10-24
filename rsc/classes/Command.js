'use strict';

const { PermissionString, CommandInteraction } = require("discord.js");
const { loadDb } = require("../functions");

/**
 * @typedef {object} CommandData
 * @property {string} name
 * @property {string} description
 * @property {boolean} guildOnly
 * @property {boolean} ownerOnly
 * @property {boolean} nsfwOnly
 * @property {PermissionString[]} userPermissions
 * @property {PermissionString[]} clientPermissions
 */

module.exports.Command = class ShaBaseCommand {
    /**
     * @param {CommandInteraction} interaction
     * @param {CommandData} data
     */
    constructor(interaction, data) {
        this.interaction = interaction;
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
        if (!this.interaction.guild) return this.#disabled = false;

        const gd = loadDb(this.interaction.guild, "guild/" + this.interaction.guild.id);
        const setting = await gd.db.getOne("commandDisabled", this.interaction.commandPath.join("/"));
        if (!setting) return this.#disabled = false;

        const bypassIds = [];
        this.bypass = false;
        if (setting.bypass.roles?.length) bypassIds.push(...setting.bypass.roles);
        if (setting.bypass.users?.length) bypassIds.push(...setting.bypass.users);
        if (setting.bypass.permissions?.length) bypassIds.push(...setting.bypass.permissions);
        if (bypassIds.length) this.bypass = bypassIds.some(r => {
            let ret = false;
            if (/\D/.test(r)) {
                if (this.interaction.member.permissionsIn(this.interaction.channel).has(r))
                    ret = true;
            } else {
                if (r === this.interaction.user.id) ret = true;
                if (this.interaction.member.roles.cache.get(r))
                    ret = true;
            }
            return ret;
        });
        if (setting.all && !this.bypass) return this.#disabled = true;
        if (setting.channels.includes(this.interaction.channel.id) && !this.bypass)
            return this.#disabled = true;
        return this.#disabled = false;
    }

    /**
     * @typedef {object} CmdDisableOpt
     * @property {{users: string[], roles: string[], permissions: PermissionString[]}} bypass - Ids to bypass
     * @property {boolean} all - Wether to set for all channels (ignores channels option)
     * @property {string[]} channels - Channel Ids to bypass
     * @property {boolean} remove - Delete the data in db
     * 
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

        const gd = loadDb(this.interaction.guild, "guild/" + this.interaction.guild.id);
        if (remove) return gd.db.delete("commandDisabled", this.interaction.commandPath.join("/"));
        return gd.db.set("commandDisabled", this.interaction.commandPath.join("/"), opt);
    }
}