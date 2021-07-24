'use strict';

const { Message, User } = require("discord.js");

/**
 * @param {Message} msg 
 * @param {User[]} targetUsers 
 * @param {"ban"|"mute"|"kick"|"strike"} punishment 
 * @param {string} reason 
 */
module.exports = (msg, targetUsers, punishment, reason) => {
    let infractionCase = msg.guild.DB.infractions.size;
    return {
        infraction: infractionCase ? ++infractionCase : 1,
        by: targetUsers,
        moderator: msg.author,
        punishment: punishment,
        reason: reason,
        msg: msg.toJSON()
    }
}