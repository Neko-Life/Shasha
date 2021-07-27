'use strict';

const commando = require("@iceprod/discord.js-commando");
const { Message } = require("discord.js");
const { DateTime, Interval } = require("luxon");
const { trySend, getUser, defaultImageEmbed, splitOnLength, defaultDateFormat } = require("../../resources/functions");
const getColor = require("../../resources/getColor");
const { intervalToDuration } = require("../moderation/src/duration");

module.exports = class profile extends commando.Command {
    constructor(client) {
        super(client, {
            name: "profile",
            memberName: "profile",
            aliases: ["about", "who-is"],
            group: "profile",
            description: "Show Users/Member profile"
        });
    }
    /**
     * 
     * @param {Message} msg 
     * @param {*} arg 
     * @returns 
     */
    async run(msg, arg) {
        let TM, title = "";
        if (!arg) TM = msg.author; else TM = await getUser(msg, arg, true);
        if (!TM) return trySend(msg.client, msg, "Bro stop lookin for yo imaginary gf");
        if (TM.bot) title += "`[BOT]` ";
        title += `\`${TM.tag}\`'s Profile`;

        const MEM = msg.guild.member(TM),
            emb = defaultImageEmbed(msg, null, title);

        emb.setThumbnail(TM.displayAvatarURL({ format: "png", size: 4096, dynamic: true }))
            .addField("ID", TM.id)
            .addField("Registered", defaultDateFormat(TM.createdAt) +
                `\n(<t:${Math.floor(TM.createdAt.valueOf() / 1000)}:R>)`);
        if (TM.description) emb.setDescription(TM.description);

        if (MEM) {
            const RI = MEM.roles.cache.sort((a, b) => b.position - a.position).map(r => r.id).slice(0, -1),
                RFS = splitOnLength(RI, 1010, ">, <@&"), INT = Interval.fromDateTimes(DateTime.fromJSDate(MEM.joinedAt), DateTime.now());

            emb.addField("Joined", defaultDateFormat(MEM.joinedAt) + `\n(${intervalToDuration(INT).strings.join(" ")} ago)`)
                .addField("Nick", `\`${MEM.displayName}\``)
                .setColor(getColor(MEM.displayColor));

            if (RFS[0]?.length > 0) {
                for (const p of RFS) {
                    emb.addField(emb.fields.length === 4 ? "Roles" : "​", "<@&" + p.join(">, <@&") + ">");
                }
            }
        }
        return trySend(this.client, msg, emb);
    }
};