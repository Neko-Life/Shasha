'use strict';

const { PermissionString } = require("discord.js");

/**
 * @typedef {object} CommandData
 * @property {string} name
 * @property {string} description
 * @property {boolean} guildOnly
 * @property {PermissionString[]} userPermissions
 * @property {PermissionString[]} clientPermissions
 */

class Command {
    /**
     * @param {CommandData} data
     */
    constructor(interaction, data) {
        this.interaction = interaction;
        this.name = data.name;
        this.description = data.description;
        this.guildOnly = data.guildOnly || false;
        this.userPermissions = data.userPermissions || [];
        this.clientPermissions = data.clientPermissions || [];
    }
}

module.exports = { Command }