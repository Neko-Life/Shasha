'use strict';

module.exports = async (GUILD, USER) => {
    if (GUILD.eventChannels?.ban) {
        if (USER.partial) USER = await USER.fetch();
        const log = getChannel(GUILD, GUILD.eventChannels.ban);
        if (!log) return;
        const emb = defaultEventLogEmbed(GUILD);
        const rea = (await GUILD.fetchBan(USER)).reason;
        emb.setDescription(rea ?? "No reason provided.")
            .setTitle(`User \`${USER.tag}\` banned`)
            .setColor(getColor("red"))
            .setThumbnail(USER.displayAvatarURL({ size: 4096, format: "png", dynamic: true }))
            .addField("User", `<@${USER.id}>\n(${USER.id})`);
        return trySend(GUILD.client, log, emb);
    }
}