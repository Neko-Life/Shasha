'use strict';

if (process.argv.includes("-d")) process.dev = true;

// const { exec } = require("child_process");
// require("./rsc/mongo");
// require("./rsc/structures");
require("./rsc/util/Duration");
const { Intents, Options } = require("discord.js");
const configFile = require("./config.json");
const { ShaBaseDb } = require("./rsc/classes/Database");
const ShaClient = require("./rsc/classes/ShaClient");
const { logDev } = require("./rsc/debug");
const { database } = require("./rsc/mongo");
const dashboard = null; // exec("cd dashboard && npm run dev", (e) => console.error);
const client = new ShaClient({
    partials: ["CHANNEL", "GUILD_MEMBER", "MESSAGE", "USER"],
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.DIRECT_MESSAGES
    ],
    dashboard: dashboard,
    db: new ShaBaseDb(database, "main"),
    makeCache: Options.cacheWithLimits(
        {
            MessageManager: 1010
        }
    )
});

client.dispatch();
// require("./rsc/tCmd")(client);

// if (process.argv.includes("-d")) {
//     const ex = client.tCmds["debug"];
//     if (ex) ex.run(client); else console.log("No debug module in tCmds.");
// }

// const { errLog, trySend, defaultEventLogEmbed } = require('./rsc/functions');
// const { getColor } = require("./rsc/functions");
// const { chatAnswer } = require("./rsc/shaChat");
// const { init } = require("./cmds/moderation/src/createSchedule");
// const { dbClient } = require("./rsc/mongo");

// client.functions = requireAll({
//     dirname: join(__dirname, "rsc"),
//     recursive: true
// });

// client.on("message", async msg => {
//     if (!msg.author.DB) await msg.author.dbLoad();
//     client.eventsHandlers.message.letsChat(msg);

//     if (msg.mentions.has(client.user) && !msg.isCommand && msg.channel.id != configFile.chatChannel) {
//         const re = new RegExp("@​" + (msg.guild ? msg.guild.member(client.user).displayName : msg.author.username));
//         const u = msg.cleanContent.replace(re, "").trim();
//         console.log(u, re);
//         if (u.length > 0) {
//             msg.channel.startTyping();
//             await trySend(client, msg, await chatAnswer(u));
//         };
//     }

//     if (!msg.guild) {
//         //console.log(`(${msg.channel.recipient.id}) ${msg.channel.recipient.tag}: (${msg.author.id}) ${msg.author.tag}: ${msg.content}`);
//     } else {
//         if (!msg.guild.DB) await msg.guild.dbLoad();
//         client.eventsHandlers.message.giveNickHeart(msg);
//     }

//     client.eventsHandlers.message.run(msg);
// });

// client.on("guildMemberRemove", async (member) => {
//     //console.log(`User ${memberLeave.displayName} (${memberLeave.user.tag}) (${memberLeave.id}) left ${memberLeave.guild.name} (${memberLeave.guild.id}). Now it has ${memberLeave.guild.memberCount} total members count.`);
//     if (!member.guild.DB) await member.guild.dbLoad();
//     client.eventsHandlers.guildMemberRemove(member);
// });

// client.on("guildCreate", newShaGuild => {
//     const shaGuild = client.guilds.cache.map(g => g);
//     trySend(client, configFile.guildLog, `Joined **${newShaGuild.name}** <:awamazedLife:795227334339985418> I'm in ${shaGuild.length} servers now.`);
// });

// client.on("guildDelete", leaveShaGuild => {
//     const shaGuild = client.guilds.cache.map(g => g);
//     trySend(client, configFile.guildLog, `Left **${leaveShaGuild.name}** <:WhenLife:773061840351657984> I'm in ${shaGuild.length} servers now.`);
// });

// client.on("guildMemberAdd", async (member) => {
//     //console.log(`New member ${newMember.displayName} (${newMember.user.tag}) (${newMember.id}) joined ${newMember.guild.name} (${newMember.guild.id})! Now it has ${newMember.guild.memberCount} total members count.`);
//     if (!member.guild.DB) await member.guild.dbLoad();
//     if (!member.user.DB && !member.user.bot) await member.user.dbLoad();
//     client.eventsHandlers.guildMemberAdd(member);
// });

// client.on("guildBanAdd", async (GUILD, USER) => {
//     client.eventsHandlers.guildBanAdd(GUILD, USER);
// });

// client.on("guildBanRemove", async (GUILD, USER) => {
//     client.eventsHandlers.guildBanRemove(GUILD, USER);
// });

// client.on("guildUpdate", async (oldGuild, newGuild) => {
//     client.eventsHandlers.guildUpdate(oldGuild, newGuild);
// });

// client.on("channelUpdate", async (oldChannel, newChannel) => {
//     client.eventsHandlers.channelUpdate.run(oldChannel, newChannel);
// });

// client.on("messageDelete", async (msg) => {
//     if (msg.author && !msg.author.DB) await msg.author.dbLoad();
//     if (msg.guild) {
//         if (!msg.guild.DB) await msg.guild.dbLoad();
//         client.eventsHandlers.messageDelete(msg);
//     }
// });

// client.on("messageUpdate", async (msgold, msgnew) => {
//     if (!msgnew.author?.DB) await msgnew.author?.dbLoad();
//     if (msgnew.guild) {
//         if (!msgnew.guild.DB) await msgnew.guild.dbLoad();
//         client.eventsHandlers.messageUpdate(msgold, msgnew);
//     }
// });

// client.on("guildMemberUpdate", async (memberold, membernew) => {
//     //console.log(memberold.toJSON(), "\n\n", membernew.toJSON());
//     if (!membernew.user.DB) await membernew.user.dbLoad();
//     if (!membernew.guild.DB) await membernew.guild.dbLoad();
//     client.eventsHandlers.guildMemberUpdate(memberold, membernew);
// });

// client.on("roleUpdate", async (oldRole, newRole) => {
//     client.eventsHandlers.roleUpdate.run(oldRole, newRole);
// });

// client.on("shardReady", async (shard) => {
//     const log = client.channels.cache.get(configFile.shardChannel);
//     if (!log.guild.DB) await log.guild.dbLoad();
//     const emb = defaultEventLogEmbed(log.guild);
//     emb.setTitle("Shard #" + shard)
//         .setDescription("**CONNECTED**")
//         .setColor(getColor("blue"));
//     trySend(client, log, emb);
// });

// client.on("shardReconnecting", async (shard) => {
//     const log = client.channels.cache.get(configFile.shardChannel);
//     if (!log.guild.DB) await log.guild.dbLoad();
//     const emb = defaultEventLogEmbed(log.guild);
//     emb.setTitle("Shard #" + shard)
//         .setDescription("**RECONNECTING**")
//         .setColor(getColor("cyan"));
//     trySend(client, log, emb);
// });

// client.on("shardDisconnect", async (e, shard) => {
//     const log = client.channels.cache.get(configFile.shardChannel);
//     if (!log.guild.DB) await log.guild.dbLoad();
//     const emb = defaultEventLogEmbed(log.guild);
//     emb.setTitle("Shard #" + shard)
//         .setDescription("**DISCONNECTED\n\nTARGET:**```js\n" + JSON.stringify(e.target, (k, v) => v || undefined, 2) + "```")
//         .addField("CODE", e.code, true)
//         .addField("REASON", e.reason, true)
//         .addField("CLEAN", e.wasClean, true)
//         .setColor(getColor("yellow"));
//     trySend(client, log, emb);
// });

// client.on("shardResume", async (shard) => {
//     const log = client.channels.cache.get(configFile.shardChannel);
//     if (!log.guild.DB) await log.guild.dbLoad();
//     const emb = defaultEventLogEmbed(log.guild);
//     emb.setTitle("Shard #" + shard)
//         .setDescription("**RESUMED**")
//         .setColor(getColor("green"));
//     trySend(client, log, emb);
// });

// client.on("shardError", async (e, shard) => {
//     const log = client.channels.cache.get(configFile.shardChannel);
//     if (!log.guild.DB) await log.guild.dbLoad();
//     const emb = defaultEventLogEmbed(log.guild);
//     emb.setTitle("Shard #" + shard)
//         .setDescription("**ERROR**")
//         .setColor(getColor("red"));
//     trySend(client, log, emb);
//     errLog(e, null, client);
// });

// client.on("commandRun", async (c, u, msg) => {
//     if (!msg.author.DB) await msg.author.dbLoad();
//     if (msg.member) if (!msg.member.DB) await msg.member.dbLoad();
//     if (msg.guild && !msg.guild.DB) await msg.guild.dbLoad();
// });

// client.on("warn", e => {
//     console.error(e);
//     errLog(e, null, client);
// });
// client.on("error", e => {
//     console.error(e);
//     errLog(e, null, client);
// });
// client.on("commandError", (c, e, m) => {
//     console.error(e);
//     errLog(e, m, client);
//     m?.channel.stopTyping();
// });

process.on("uncaughtException", e => {
    logDev(e);
    if (client.errorChannel) {
        client.errorChannel.send("`[ EXCEPTION ]` ```js\n" + e.stack + "```");
    }
    // errLog(e, null, client);
});
process.on("unhandledRejection", e => {
    logDev(e);
    if (client.errorChannel) {
        client.errorChannel.send("`[ REJECTION ]` ```js\n" + e.stack + "```");
    }
    //     errLog(e, null, client);
    //     if (/MongoError: Topology is closed, please connect/.test(e.message)) {
    //         console.log("Trying reconnecting...");
    //         return dbClient.connect();
    //     }
});
// process.on("warning", e => {
//     console.error(e);
//     errLog(e, null, client);
// });

client.login(configFile.token);