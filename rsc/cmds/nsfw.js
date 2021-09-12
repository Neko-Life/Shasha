'use strict';

const { Command } = require("../classes/Command");
const nsfwCmd = require("../rsc/nsfwCmd");

const INTERACT_ENDPOINTS = ["ass","athighs","blow","boobs","feet","furfuta","furgif","futa","gifs","hboobs","hentai","hfeet","jackopose","kink","milk","pantsu","sex","slime","thighs","trap","yuri"];

for (const IE of INTERACT_ENDPOINTS) {
    module.exports[IE] = class extends Command {
        constructor(interaction) {
            super(interaction, {
                name: IE,
                clientPermissions: ["EMBED_LINKS"]
            });
        }

        async run(inter, { lewds, message }) {
          if (!inter.guild.channels.get(inter.channel.id).nsfw) return inter.reply("This is not an NSFW channel, baka!");
            return interactCmd(inter, IE, lewds, message?.value);
        }
    }
}

module.exports.constant = { INTERACT_ENDPOINTS }
