'use strict';

const { Command } = require("../classes/Command");

module.exports = class ButtsCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "butts"
        });
    }
    async run(inter, loods) {
    loods.nsfw(this.name).then(result =>{
        return inter.reply({ embeds: { (new MessageEmbed().setImage(result)) }, true })
        })
    }
}
