'use strict';

const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new SlashCommandBuilder()
    .setName("reminder")
    .setDescription("Reminder for your super tight schedules")
    .addSubcommand(
        sCmd => sCmd
            .setName("remind")
            .setDescription("I can remind you about your gf birthday")
            .addStringOption(
                opt => opt
                    .setName("about")
                    .setDescription("`my gf 69th birthday`")
                    .setRequired(true)
            ).addStringOption(
                opt => opt
                    .setName("at")
                    .setDescription("Provide somethin like `November 29, 2069 11:04:20 PM` or `in 69m420s`")
                    .setRequired(true)
            ).addStringOption(
                opt => opt
                    .setName("timezone")
                    .setDescription("Your gf timezone. Default to Greenland")
                    .setAutocomplete(true)
            ).addChannelOption(
                opt => opt
                    .setName("channel")
                    .setDescription("Send your reminder here")
                    .addChannelTypes([0, 5, 10, 12, 11, 6])
            )
    )