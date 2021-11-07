'use strict';

const { Command } = require("../../classes/Command");
const nsfwCmd = require("../../rsc/nsfwCmd");
const { NSFW_ENDPOINTS } = require("../../constants");

module.exports = class NsfwImageCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "nsfwimage",
            nsfwOnly: true
        });
    }

    async run(inter, { category }) {
        if (!category) category = NSFW_ENDPOINTS[Math.floor(Math.random() * NSFW_ENDPOINTS.length)];
        else category = category.value;
        return nsfwCmd(inter, category);
    }
}