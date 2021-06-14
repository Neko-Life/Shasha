'use strict';

require("./database/mongo");
require("./resources/structures");
const Commando = require('@iceprod/discord.js-commando');
const client = new Commando.Client({
    owner: ['820696421912412191', '750335181285490760'],
    partials: ["CHANNEL", "GUILD_MEMBER", "MESSAGE", "REACTION", "USER"]
});
const sqlite = require('sqlite');
const configFile = require('./config.json');
const { errLog, trySend, noPerm, getUTCComparison, defaultEventLogEmbed } = require('./resources/functions');
const { join } = require('path');
const { chatAnswer } = require("./resources/shaChat");
const getColor = require("./resources/getColor");
const { timestampAt } = require("./resources/debug");

const msgDeleteLogger = require("./resources/eventsLogger/messageDelete");
const msgUpdateLogger = require("./resources/eventsLogger/messageUpdate");
const guildMemberAddLogger = require("./resources/eventsLogger/guildMemberAdd");
const guildMemberUpdateLogger = require("./resources/eventsLogger/guildMemberUpdate");
const guildMemberRemoveLogger = require("./resources/eventsLogger/guildMemberRemove");
const { letsChat, giveNickHeart } = require("./resources/eventsLogger/message");

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
.registerDefaults()
.registerCommandsIn(join(__dirname, 'cmds'));

client.setProvider(
    sqlite.open({
        filename:join(__dirname, 'settings.sqlite3'),
        driver:require("sqlite3").Database
    }).then(db => new Commando.SQLiteProvider(db))
).catch(e => errLog(e));

client.on('ready', async () => {
    //shaGuild = client.guilds.cache.map(g => g);
    //console.log(`Member in ${shaGuild.length} guilds.`);
    //const statusChannel = client.channels.cache.get(configFile.statusChannel);
    console.log(client.user.tag+' logged in!');
});

client.on("message", async msg => {
    if (!client.matchTimestamp) client.matchTimestamp = 0;//getUTCComparison(msg.createdTimestamp);
    if (!msg.author.dbLoaded && !msg.author.bot) await msg.author.dbLoad();
    letsChat(msg);

    if (!msg.guild) {
        //console.log(`(${msg.channel.recipient.id}) ${msg.channel.recipient.tag}: (${msg.author.id}) ${msg.author.tag}: ${msg.content}`);
    } else {
        if (!msg.guild.dbLoaded) await msg.guild.dbLoad();
        giveNickHeart(msg);
    }
});

client.on("guildMemberRemove", async (member) => {
    //console.log(`User ${memberLeave.displayName} (${memberLeave.user.tag}) (${memberLeave.id}) left ${memberLeave.guild.name} (${memberLeave.guild.id}). Now it has ${memberLeave.guild.memberCount} total members count.`);
    if (!member.guild.dbLoaded) await member.guild.dbLoad();
    guildMemberRemoveLogger(member);
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
    if (!member.guild.dbLoaded) await member.guild.dbLoad();
    if (!member.user.dbLoaded && !member.user.bot) await member.user.dbLoad();
    guildMemberAddLogger(member);
});

client.on("messageDelete", async (msg) => {
    if (msg.author && !msg.author.dbLoaded && !msg.author.bot) await msg.author?.dbLoad();
    if (msg.guild) {
        if (!msg.guild.dbLoaded) await msg.guild.dbLoad();
        msgDeleteLogger(msg);
    }
});

client.on("messageUpdate", async (msgold, msgnew) => {
    if (msgnew.author && !msgnew.author.dbLoaded && !msgnew.author.bot) await msgnew.author?.dbLoad();
    if (msgnew.guild) {
        if (!msgnew.guild.dbLoaded) await msgnew.guild.dbLoad();
        msgUpdateLogger(msgold, msgnew);
    }
});

client.on("guildMemberUpdate", async (memberold, membernew) => {
    //console.log(memberold.toJSON(), "\n\n", membernew.toJSON());
    if (!membernew.user.dbLoaded && !membernew.user.bot) {
        await membernew.user.dbLoad();
    }
    if (!membernew.guild.dbLoaded) {
        await membernew.guild.dbLoad();
    }
    guildMemberUpdateLogger(memberold, membernew);
});

client.on("shardReady", (shard) => {
    const log = client.channels.cache.get(configFile.shardChannel);
    const emb = defaultEventLogEmbed(client.guilds.cache.get(configFile.home));
    emb.setTitle("Shard #" + shard)
    .setDescription("**CONNECTED**")
    .setColor(getColor("blue"));
    trySend(client, log, emb);
});

client.on("shardReconnecting", (shard) => {
    const log = client.channels.cache.get(configFile.shardChannel);
    const emb = defaultEventLogEmbed(client.guilds.cache.get(configFile.home));
    emb.setTitle("Shard #" + shard)
    .setDescription("**RECONNECTING**")
    .setColor(getColor("cyan"));
    trySend(client, log, emb);
});

client.on("shardDisconnect", (e, shard) => {
    const log = client.channels.cache.get(configFile.shardChannel);
    const emb = defaultEventLogEmbed(client.guilds.cache.get(configFile.home));
    emb.setTitle("Shard #" + shard)
    .setDescription("**DISCONNECTED\n\nTARGET:**```js\n" + JSON.stringify(e.target, (k, v) => v ?? undefined, 2) + "```")
    .addField("CODE", e.code, true)
    .addField("REASON", e.reason, true)
    .addField("CLEAN", e.wasClean, true)
    .setColor(getColor("yellow"));
    trySend(client, log, emb);
});

client.on("shardResume", (shard) => {
    const log = client.channels.cache.get(configFile.shardChannel);
    const emb = defaultEventLogEmbed(client.guilds.cache.get(configFile.home));
    emb.setTitle("Shard #" + shard)
    .setDescription("**RESUMED**")
    .setColor(getColor("green"));
    trySend(client, log, emb);
});

client.on("shardError", (e, shard) => {
    const log = client.channels.cache.get(configFile.shardChannel);
    const emb = defaultEventLogEmbed(client.guilds.cache.get(configFile.home));
    emb.setTitle("Shard #" + shard)
    .setDescription("**ERROR**")
    .setColor(getColor("red"));
    trySend(client, log, emb);
    errLog(e, null, client);
});

client.on("error", e => errLog(e, null, client));
client.on("commandError", e => errLog(e, null, client));

process.on("uncaughtException", e => errLog(e, null, client));
process.on("unhandledRejection", e => errLog(e, null, client));
process.on("warning", e => errLog(e, null, client));

//client.on("debug", (...args) => console.log(...args, timestampAt()));

client.login(configFile.token);