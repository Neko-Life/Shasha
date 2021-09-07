'use strict';

const { PermissionString, CommandInteraction } = require("discord.js");

/**
 * @typedef {object} CommandData
 * @property {string} name
 * @property {string} description
 * @property {boolean} guildOnly
 * @property {boolean} ownerOnly
 * @property {PermissionString[]} userPermissions
 * @property {PermissionString[]} clientPermissions
 */

class ShaBaseCommand {
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
        this.userPermissions = data.userPermissions || [];
        this.clientPermissions = data.clientPermissions || [];
    }
}

module.exports = { Command: ShaBaseCommand }