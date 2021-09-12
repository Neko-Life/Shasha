'use strict';

const { Command } = require("../classes/Command");
const nsfwCmd = require("../rsc/nsfwCmd");

const NSFW_ENDPOINTS = ["ass", "athighs", "blow", "boobs", "feet", "furfuta", "furgif", "futa", "gifs", "hboobs", "hentai", "hfeet", "jackopose", "milk", "pantsu", "sex", "slime", "trap", "yuri"];


module.exports = class NsfwCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "nsfw",
            clientPermissions: ["EMBED_LINKS"]
        });
    }

    async run(inter, { category }) {
        if (!inter.channel.nsfw) return inter.reply("This is not an NSFW channel, baka!");
        if (!category) category = NSFW_ENDPOINTS[Math.floor(Math.random() * NSFW_ENDPOINTS.length)];
        else category = category.value;
        return nsfwCmd(inter, category);
    }
}

module.exports.constant = { NSFW_ENDPOINTS }
