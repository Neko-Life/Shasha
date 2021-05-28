'use strict';

require("./database/mongo");
require("./resources/structures");
const Commando = require('@iceprod/discord.js-commando');
const client = new Commando.Client({
    owner: ['820696421912412191', '750335181285490760'],
    partials: ["CHANNEL", "GUILD_MEMBER", "MESSAGE", "REACTION", "USER"]
});
const sqlite = require('sqlite');
let configFile = require('./config.json');
const { errLog, trySend } = require('./resources/functions');
const { join } = require('path');
const { chatAnswer } = require("./resources/shaChat");
const { timestampAt } = require("./resources/debug");

client.registry
.registerGroups([
    'utility',
    'moderation',
    'experiment',
    'image',
    'fun'
])
.registerDefaults()
.registerCommandsIn(join(__dirname, 'cmds'));

client.setProvider(
    sqlite.open({
        filename:join(__dirname, 'settings.sqlite3'),
        driver:require("sqlite3").Database
    }).then(db => new Commando.SQLiteProvider(db))
).catch(e => errLog(e));

const guildLog = "840154722434154496";

client.on('ready', async () => {
    //shaGuild = client.guilds.cache.map(g => g);
    //console.log(`Member in ${shaGuild.length} guilds.`);
    console.log(client.user.tag+' logged in!');
});

client.on("message", async msg => {
    if (msg.guild?.dbLoaded === false && !msg.author.bot) {
        await msg.guild.dbLoad();
    }
    if (msg.author.dbLoaded === false && !msg.author.bot) {
        await msg.author.dbLoad();
    }
    if (msg.channel.id === "837178237322919966" && !msg.author.bot && !msg.content.toLowerCase().startsWith(client.commandPrefix+"chat")) {
        chatAnswer(client, msg);
    }

    if (!msg.guild) {
        console.log(`(${msg.channel.recipient.id}) ${msg.channel.recipient.tag}: (${msg.author.id}) ${msg.author.tag}: ${msg.content}`);
    }
});

client.on("guildMemberRemove", memberLeave => {
        //console.log(`User ${memberLeave.displayName} (${memberLeave.user.tag}) (${memberLeave.id}) left ${memberLeave.guild.name} (${memberLeave.guild.id}). Now it has ${memberLeave.guild.memberCount} total members count.`);
});

client.on("guildCreate", newShaGuild => {
    const shaGuild = client.guilds.cache.map(g => g);
    trySend(client, guildLog, `Joined **${newShaGuild.name}** (${newShaGuild.id}) <:awamazedLife:795227334339985418> I'm in ${shaGuild.length} servers now.`);
});

client.on("guildDelete", leaveShaGuild => {
    const shaGuild = client.guilds.cache.map(g => g);
    trySend(client, guildLog, `Left **${leaveShaGuild.name}** (${leaveShaGuild.id}) <:WhenLife:773061840351657984> I'm in ${shaGuild.length} servers now.`);
});

client.on("guildMemberAdd", newMember => {
    //console.log(`New member ${newMember.displayName} (${newMember.user.tag}) (${newMember.id}) joined ${newMember.guild.name} (${newMember.guild.id})! Now it has ${newMember.guild.memberCount} total members count.`);
});

process.on("uncaughtException", e => errLog(e, null, client));
process.on("unhandledRejection", e => errLog(e, null, client));
process.on("warning", e => errLog(e, null, client));

client.on("debug", (...args) => console.log(...args, timestampAt()));

client.login(configFile.token);