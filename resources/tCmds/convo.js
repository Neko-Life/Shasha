'use strict';

const emoteMessage = require("../emoteMessage");
const { getChannel, parseDash, cleanMentionID, trySend } = require("../functions");
const { getGuild } = require("./resources/functions");
let a, G, C = [], last = 0, nO = "Args: [`-g` Guild: `[name|ID]` | `-u` Remove channel: `[index]`] `-c` Channel: `[name|ID]` [`-q` End current session | `-r` Resume previous session]";
//const p = require("child_process");

module.exports = {
    description: "Start a convo in a channel",
    aliases: ["c"],
    run(client, arg) {
        if (!a) {
            client.addListener("message", m => {
                if (client.convo && C.map(r => r?.id).includes(m.channel.id)) {
                    const n = C.indexOf(m.channel);
                    if (!m.author.bot) last = n;
                    console.log(n + ":", m.channel.name, m.channel.id, m.author.id, m.author.tag + ":", m.cleanContent);
                }
            });
            a = true;
        }
        let num = parseInt(arg.match(/^\d+/)?.[0], 10), sl;
        if (!num) num = last; else {
            last = num;
            sl = true;
        };
        let U, H;
        if (!arg) {
            if (C.length > 0) {
                console.log("Watching:");
                for (let i = 0; i < C.length; i++) console.log(i + ".", C[i].guild.name, C[i].name, C[i].id);
                console.log("State:", client.convo || false);
            }
            return console.log(nO);
        }
        if (/(?<!\\)(-u |-g |-c |-q|-r)/.test(arg)) {
            const args = parseDash(arg);
            for (const u of args) {
                if (u.startsWith("g ")) {
                    H = u.slice(2).trim();
                    G = getGuild(client, H);
                }
                if (u.startsWith("c ")) {
                    U = u.slice(2).trim();
                    if (U === "ALL GC") {
                        // if (G) {
                        //     C.push(G.channels.cache.map(r => r));
                        //     continue;
                        // }
                        C = client.channels.cache.map(r => r);
                        continue;
                    }
                    if (U === "ALL NOT GC") {
                        C = [];
                        continue;
                    }
                    if (G) {
                        C.push(getChannel(G, U, ["category", "voice"]));
                    } else {
                        if (H) console.log("No guild found:", H);
                        const U2 = cleanMentionID(U);
                        if (/^\d{17,19}$/.test(U2)) {
                            C.push(client.channels.cache.get(U2));
                        } else {
                            const c = client.channels.cache.map(r => r);
                            C.push(c.filter(r => new RegExp(U2, "i").test(r.name))?.[0]);
                        }
                    }
                }
                if (u.startsWith("u ")) {
                    const n = parseInt(u.match(/\d+/), 10);
                    console.log("Removing", C[n].name, C[n].id);
                    return C.splice(n, 1);
                }
                if (u === "r") {
                    if (C.length > 0) {
                        for (let i = 0; i < C.length; i++) console.log("Resuming session:", C[i].guild.name, C[i].guild.id, i + ":", C[i].name, C[i].id);
                        return client.convo = true;
                    } else return console.log("No previous session");
                }
                if (u === "q") {
                    if (C.length > 0 && client.convo) {
                        for (let i = 0; i < C.length; i++) console.log("Ending session:", C[i].guild.name, C[i].guild.id, i + ":", C[i].name, C[i].id);
                        client.convo = false;
                    }
                    return console.log("Ended");
                }
            }
            if (!U || C.length === 0) {
                if (G) {
                    console.log("Channels in:", G.name, G.id);
                    for (const k of G.channels.cache.map(r => r)) if (k.type != "category") console.log(k.name, k.id);
                    return;
                } else {
                    if (U) return console.log("No channel found:", U, H && G ? "in guild: " + G.name + " " + G.id + " (" + H + ")" : ""); else return console.log("Provide channel");
                }
            }
            console.log("Session:");
            for (let i = 0; i < C.length; i++) console.log(C[i].guild.name, C[i].guild.id, i + ":", C[i].name, C[i].id);
        } else if (C[num]) return C[num].send(emoteMessage(client, sl ? arg.slice(num?.toString().length).trim() || "hi" : arg)).catch(console.error); else {
            console.log('No session. Available sessions:');
            for (let i = 0; i < C.length; i++) console.log(C[i].guild.name, C[i].guild.id, i + ":", C[i].name, C[i].id);
            return;
        };
        return client.convo = true;
    }
}