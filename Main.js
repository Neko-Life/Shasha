'use strict';

require("./database/mongo");
require("./resources/structures");
const Commando = require('@iceprod/discord.js-commando');
const client = new Commando.Client({
    owner: ['820696421912412191', '750335181285490760'],
    partials: ["CHANNEL", "GUILD_MEMBER", "MESSAGE", "REACTION", "USER"]
});
require("./resources/tCmd")(client);

if (process.argv.includes("-d")) {
    const ex = client.tCmds["debug"];
    if (ex) ex.run(client); else console.log("No debug module in tCmds.");
}

const sqlite = require('sqlite');
const configFile = require('./config.json');
const { errLog, trySend, defaultEventLogEmbed } = require('./resources/functions');
const { join } = require('path');
const getColor = require("./resources/getColor");
const requireAll = require("require-all");
const { chatAnswer } = require("./resources/shaChat");
const { init } = require("./cmds/moderation/src/createSchedule");
const { dbClient } = require("./database/mongo");

const lgr = requireAll({ dirname: join(__dirname, "resources/eventsLogger"), recursive: true });
client.functions = requireAll({ dirname: join(__dirname, "resources"), recursive: true });

client.registry
    .registerGroups([
        'utility',
        'moderation',
        'experiment',
        'image',
        'fun',
        "profile",
        "owner"
    ])
    .registerDefaultTypes()
    .registerCommandsIn(join(__dirname, 'cmds'));

client.setProvider(
    sqlite.open({
        filename: join(__dirname, 'settings.sqlite3'),
        driver: require("sqlite3").Database
    }).then(db => new Commando.SQLiteProvider(db))
).catch(e => errLog(e));

client.on('ready', async () => {
    //client.user.setStatus("invisible");
    //shaGuild = client.guilds.cache.map(g => g);
    //console.log(`Member in ${shaGuild.length} guilds.`);
    //const statusChannel = client.channels.cache.get(configFile.statusChannel);
    console.log(client.user.tag + ' logged in!');
    init(client);
});

client.on("message", async msg => {
    if (!client.matchTimestamp) client.matchTimestamp = 0;//getUTCComparison(msg.createdTimestamp);
    if (!msg.author.DB) await msg.author.dbLoad();
    lgr.message.letsChat(msg);

    if (msg.mentions.has(client.user) && !msg.isCommand && msg.channel.id != configFile.chatChannel) {
        const re = new RegExp("@​" + (msg.guild ? msg.guild.member(client.user).displayName : msg.author.username));
        const u = msg.cleanContent.replace(re, "").trim();
        console.log(u, re);
        if (u.length > 0) {
            msg.channel.startTyping();
            await trySend(client, msg, await chatAnswer(u));
        };
    }

    if (!msg.guild) {
        //console.log(`(${msg.channel.recipient.id}) ${msg.channel.recipient.tag}: (${msg.author.id}) ${msg.author.tag}: ${msg.content}`);
    } else {
        if (!msg.guild.DB) await msg.guild.dbLoad();
        lgr.message.giveNickHeart(msg);
    }

    lgr.message.run(msg);
});

client.on("guildMemberRemove", async (member) => {
    //console.log(`User ${memberLeave.displayName} (${memberLeave.user.tag}) (${memberLeave.id}) left ${memberLeave.guild.name} (${memberLeave.guild.id}). Now it has ${memberLeave.guild.memberCount} total members count.`);
    if (!member.guild.DB) await member.guild.dbLoad();
    lgr.guildMemberRemove(member);
});

client.on("guildCreate", newShaGuild => {
    const shaGuild = client.guilds.cache.map(g => g);
    trySend(client, configFile.guildLog, `Joined **${newShaGuild.name}** <:awamazedLife:795227334339985418> I'm in ${shaGuild.length} servers now.`);
});

client.on("guildDelete", leaveShaGuild => {
    const shaGuild = client.guilds.cache.map(g => g);
    trySend(client, configFile.guildLog, `Left **${leaveShaGuild.name}** <:WhenLife:773061840351657984> I'm in ${shaGuild.length} servers now.`);
});

client.on("guildMemberAdd", async (member) => {
    //console.log(`New member ${newMember.displayName} (${newMember.user.tag}) (${newMember.id}) joined ${newMember.guild.name} (${newMember.guild.id})! Now it has ${newMember.guild.memberCount} total members count.`);
    if (!member.guild.DB) await member.guild.dbLoad();
    if (!member.user.DB && !member.user.bot) await member.user.dbLoad();
    lgr.guildMemberAdd(member);
});

client.on("guildBanAdd", async (GUILD, USER) => {
    lgr.guildBanAdd(GUILD, USER);
});

client.on("guildBanRemove", async (GUILD, USER) => {
    lgr.guildBanRemove(GUILD, USER);
});

client.on("guildUpdate", async (oldGuild, newGuild) => {
    lgr.guildUpdate(oldGuild, newGuild);
});

client.on("channelUpdate", async (oldChannel, newChannel) => {
    lgr.channelUpdate.run(oldChannel, newChannel);
});

client.on("messageDelete", async (msg) => {
    if (msg.author && !msg.author.DB) await msg.author.dbLoad();
    if (msg.guild) {
        if (!msg.guild.DB) await msg.guild.dbLoad();
        lgr.messageDelete(msg);
    }
});

client.on("messageUpdate", async (msgold, msgnew) => {
    if (!msgnew.author?.DB) await msgnew.author?.dbLoad();
    if (msgnew.guild) {
        if (!msgnew.guild.DB) await msgnew.guild.dbLoad();
        lgr.messageUpdate(msgold, msgnew);
    }
});

client.on("guildMemberUpdate", async (memberold, membernew) => {
    //console.log(memberold.toJSON(), "\n\n", membernew.toJSON());
    if (!membernew.user.DB) await membernew.user.dbLoad();
    if (!membernew.guild.DB) await membernew.guild.dbLoad();
    lgr.guildMemberUpdate(memberold, membernew);
});

client.on("roleUpdate", async (oldRole, newRole) => {
    lgr.roleUpdate.run(oldRole, newRole);
});

client.on("shardReady", async (shard) => {
    const log = client.channels.cache.get(configFile.shardChannel);
    if (!log.guild.DB) await log.guild.dbLoad();
    const emb = defaultEventLogEmbed(log.guild);
    emb.setTitle("Shard #" + shard)
        .setDescription("**CONNECTED**")
        .setColor(getColor("blue"));
    trySend(client, log, emb);
});

client.on("shardReconnecting", async (shard) => {
    const log = client.channels.cache.get(configFile.shardChannel);
    if (!log.guild.DB) await log.guild.dbLoad();
    const emb = defaultEventLogEmbed(log.guild);
    emb.setTitle("Shard #" + shard)
        .setDescription("**RECONNECTING**")
        .setColor(getColor("cyan"));
    trySend(client, log, emb);
});

client.on("shardDisconnect", async (e, shard) => {
    const log = client.channels.cache.get(configFile.shardChannel);
    if (!log.guild.DB) await log.guild.dbLoad();
    const emb = defaultEventLogEmbed(log.guild);
    emb.setTitle("Shard #" + shard)
        .setDescription("**DISCONNECTED\n\nTARGET:**```js\n" + JSON.stringify(e.target, (k, v) => v || undefined, 2) + "```")
        .addField("CODE", e.code, true)
        .addField("REASON", e.reason, true)
        .addField("CLEAN", e.wasClean, true)
        .setColor(getColor("yellow"));
    trySend(client, log, emb);
});

client.on("shardResume", async (shard) => {
    const log = client.channels.cache.get(configFile.shardChannel);
    if (!log.guild.DB) await log.guild.dbLoad();
    const emb = defaultEventLogEmbed(log.guild);
    emb.setTitle("Shard #" + shard)
        .setDescription("**RESUMED**")
        .setColor(getColor("green"));
    trySend(client, log, emb);
});

client.on("shardError", async (e, shard) => {
    const log = client.channels.cache.get(configFile.shardChannel);
    if (!log.guild.DB) await log.guild.dbLoad();
    const emb = defaultEventLogEmbed(log.guild);
    emb.setTitle("Shard #" + shard)
        .setDescription("**ERROR**")
        .setColor(getColor("red"));
    trySend(client, log, emb);
    errLog(e, null, client);
});

client.on("commandRun", async (c, u, msg) => {
    if (!msg.author.DB) await msg.author.dbLoad();
    if (msg.member) if (!msg.member.DB) await msg.member.dbLoad();
    if (msg.guild && !msg.guild.DB) await msg.guild.dbLoad();
});

client.on("warn", e => {
    console.error(e);
    errLog(e, null, client);
});
client.on("error", e => {
    console.error(e);
    errLog(e, null, client);
});
client.on("commandError", (c, e, m) => {
    console.error(e);
    errLog(e, m, client);
    m?.channel.stopTyping();
});

process.on("uncaughtException", e => {
    console.error(e);
    errLog(e, null, client);
});
process.on("unhandledRejection", e => {
    console.error(e);
    errLog(e, null, client);
    if (/MongoError: Topology is closed, please connect/.test(e.message)) {
        console.log("Trying reconnecting...");
        return dbClient.connect();
    }
});
process.on("warning", e => {
    console.error(e);
    errLog(e, null, client);
});

client.login(configFile.token);