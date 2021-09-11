'use strict';

async function handle(interaction) {
    const path = interaction.customId.split("/");
    let cmd = interaction.client.selectMenus;
    for (const U of path) {
        if (!cmd) continue;
        cmd = cmd[U];
    }
    if (!cmd?.handle)
        return interaction.reply({
            content: "Can't find that command, was sucked by a blackhole ig"
        });
    const result = cmd.handle(interaction, interaction.values);
}

module.exports = { handle }