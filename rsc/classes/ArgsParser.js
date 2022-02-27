"use strict";

const { Guild, GuildChannel, Role, Collection, User, GuildMember } = require("discord.js");
const { escapeRegExp } = require("lodash");
const { PERMISSION_NAMES } = require("../constants");
const { findRoles, findChannels, findMembers } = require("../functions");

module.exports = class ArgsParser {
    /**
     * 
     * @param {Guild} guild 
     * @param {string} arg 
     * @param {string | RegExp} argSplit 
     * @param {string} findReFlags 
     * @returns {Promise<{channels: GuildChannel[], unknown: string[]}>}
     */
    static async channels(guild, arg, argSplit = / +/, findReFlags = "i") {
        const { found: channels, unknown } = await this.baseParserGuild({
            guild, arg, argSplit, findReFlags, fn: findChannels
        });
        return { channels, unknown };
    }

    /**
     *
     * @param {Guild} guild
     * @param {string} arg
     * @param {string | RegExp} argSplit
     * @param {string} findReFlags
     * @returns {Promise<{roles: Role[], unknown: string[]}>}
     */
    static async roles(guild, arg, argSplit = / +/, findReFlags = "i") {
        const { found: roles, unknown } = await this.baseParserGuild({
            guild, arg: arg.replace(/(?:\s|^)everyone(?:\s|$)/g, " " + guild.id + " "), argSplit, findReFlags, fn: findRoles
        });
        return { roles, unknown };
    }

    /**
     *
     * @param {Guild} guild
     * @param {string} arg
     * @param {string | RegExp} argSplit
     * @param {string} findReFlags
     * @returns {Promise<{users: User[]|GuildMember[], unknown: string[]}>}
     */
    static async users(guild, arg, argSplit = / +/, findReFlags = "i") {
        const { found: users, unknown } = await this.baseParserGuild({
            guild, arg, argSplit, findReFlags, fn: findUsers
        });
        return { users, unknown };
    }

    /**
     * 
     * @param {string} arg 
     * @param {string | RegExp} argSplit 
     * @param {string} reFlags 
     * @returns {{perms:string[],noMatch:string[]}}
     */
    static permissions(arg, argSplit = / +/, reFlags = "i") {
        const val = arg.split(argSplit);
        const perms = [];
        const noMatch = [];
        for (const str of val) {
            const fil = PERMISSION_NAMES.filter(
                r => {
                    const re = new RegExp(escapeRegExp(str), reFlags);
                    return re.test(r)
                        || re.test(r.replace(/\_/g, ""))
                        || re.test(r.replace(/\_/g, "-"))
                }
            );
            if (fil?.length) {
                for (const K of fil)
                    if (!perms.includes(K))
                        perms.push(K);
            } else noMatch.push(str);
        }
        return { perms, noMatch };
    }

    /**
     * @callback BaseParserGuildCallback
     * @param {Guild} guild
     * @param {string} pattern
     * @param {string} flags
     * @return {Promise<Collection<string, any> | any>}
     * 
     * @typedef {object} BaseParserGuildParams
     * @property {Guild} guild
     * @property {string} arg
     * @property {string | RegExp} argSplit
     * @property {string} findReFlags
     * @property {BaseParserGuildCallback} fn
     * 
     * @param {BaseParserGuildParams} param0 
     * @returns {Promise<{found: any[], unknown:string[]}>}
     */
    static async baseParserGuild({ guild, arg, argSplit, findReFlags, fn } = {}) {
        const val = arg.trim().split(argSplit);
        const found = [];
        const unknown = [];
        for (const str of val) {
            let f = await fn(guild, str, findReFlags);
            if (f instanceof Collection) f = f.first();
            if (!f) unknown.push(str);
            else if (!found.find(r => r?.id === f.id)) found.push(f);
        }
        return { found, unknown };
    }
}

async function findUsers(guild, re, flags) {
    let user = findMembers(guild, re, flags);
    if (user instanceof Collection) user = user.first();
    if (!user) user = await guild.client.findUsers(re, flags);
    return user;
}
