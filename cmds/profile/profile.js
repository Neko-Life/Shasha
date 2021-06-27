'use strict';

const commando = require("@iceprod/discord.js-commando");
const { MessageEmbed, User, Message } = require("discord.js");
const { errLog, trySend, getUser, defaultImageEmbed, splitOnLength } = require("../../resources/functions");
const getColor = require("../../resources/getColor");

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
        let TM;
        if (!arg) TM = msg.author; else TM = getUser(msg, arg);
        if (!TM) return trySend(msg.client, msg, "Bro stop lookin for yo imaginary gf");
        const MEM = msg.guild.member(TM),
        emb = defaultImageEmbed(msg, null, `\`${TM.tag}\`'s Profile`);
        emb
        .setThumbnail(TM.displayAvatarURL({format: "png", size: 4096, dynamic: true}))
        .addField("Registered", TM.createdAt.toUTCString().slice(0, -4), true)
        .addField("ID", TM.id, true);
        if (msg.author.description) {
            emb.setDescription(TM.description);
        }
        if (MEM) {
            const RI = MEM.roles.cache.sort((a, b) => b.position - a.position).map(r => r.id).slice(0, -1),
            RFS = splitOnLength(RI, 1010, ">, <@&");
            emb.addField("Joined", MEM.joinedAt.toUTCString().slice(0, -4))
            .addField("Nick", `\`${MEM.displayName}\``);
            if (RFS[0]?.length > 0) {
                for (const p of RFS) {
                    emb.addField(emb.fields.length === 4 ? "Roles" : "​", "<@&" + p.join(">, <@&") + ">");
                }
            }
        }
        return trySend(this.client, msg, emb);
    }
};