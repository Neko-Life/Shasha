'use strict';

const { fetchNeko } = require("nekos-best.js");
const { parseComa, getMember, defaultImageEmbed } = require("../../../resources/functions");

module.exports = async (msg, arg, name, endsaT = "") => {
    msg.channel.startTyping();
    let shoot = msg.member,
        target = [],
        iC = 0;
    if (!arg) {
        shoot = msg.guild.member(msg.client.user);
        target.push(msg.member.displayName);
    }
    if (!shoot.user.DB) await shoot.user.dbLoad();
    const args = parseComa(arg);
    if (args?.length > 0) {
        const mul = {
            H: {
                l: 0,
                i: -1
            },
            C: {}
        }
        for (const key of args) {
            if (!key || key.length === 0) continue;
            const t = getMember(msg.guild, key)?.[0]?.displayName;
            if (!t) continue;
            if (t === shoot.displayName) {
                const ifH = target.includes("themself (is this even physically possible)");
                if (ifH) {
                    target.filter((v, i) => {
                        if (v === "themself (is this even physically possible)") {
                            mul.H.i = i;
                            mul.H.l++;
                        }
                    });
                } else {
                    target.push("themself (is this even physically possible)");
                }
            } else {
                const ifC = target.includes(t);
                if (ifC) {
                    target.filter((v, i) => {
                        if (v === t) {
                            if (!mul.C[v]) {
                                mul.C[v] = {
                                    l: 1,
                                    i: i
                                };
                            } else {
                                mul.C[v].l++;
                            }
                        }
                    });
                } else {
                    target.push(t);
                }
            }
        }
        if (mul.H.i > -1) {
            switch (mul.H.l) {
                case 1:
                    target[mul.H.i] += " twice!";
                    break;
                case 2:
                    target[mul.H.i] += " thrice!!";
                    break;
                default:
                    target[mul.H.i] += ` ${mul.H.l++} times LMFAO`;
            }
        }
        for (const li in mul.C) {
            const d = mul.C[li];
            d.l++;
            switch (d.l) {
                case 2:
                    target[d.i] += " twice";
                    break;
                case 3:
                    target[d.i] += " thrice!";
                    break;
                default:
                    target[d.i] += ` ${d.l} times ❤️`;
            }
        }
    }
    let lT, tN, sT;
    if (target.length > 1) {
        lT = target[target.length - 1];
        sT = target.slice(0, -1);
        tN = sT.join(", ") + ` and ${lT}`;
    } else {
        if (target.length === 1) tN = target[0];
    }
    if (target.length > 0) iC += target.length;
    let ss;
    if (tN) {
        ss = name.endsWith("s") ? name + "es" : name + "s";
        const aT = `${shoot.displayName} ${ss} ${tN} ${tN.endsWith(" times LMFAO") ? "" : endsaT}`,
            count = shoot.user.DB.interactions[name] + (iC > 0 ? 1 : 0),
            emb = defaultImageEmbed(msg, (await fetchNeko(name)).url);
        let num;
        if (count) {
            const u = count?.toString();
            if (u?.endsWith("1") && !u.endsWith("11")) {
                num = count + "st";
            } else {
                if (u?.endsWith("2") && !u.endsWith("12")) {
                    num = count + "nd";
                } else {
                    if (u?.endsWith("3") && !u.endsWith("13")) {
                        num = count + "rd";
                    } else {
                        num = count + "th";
                    }
                }
            }
        } else {
            shoot.user.DB.interactions[name] = 0;
            num = "First";
        }
        shoot.user.DB.interactions[name] += iC;
        shoot.user.setInteractions(shoot.user.DB.interactions);
        emb.setAuthor(aT.length > 256 ? `${shoot.displayName} ${ss} so many friends ❤️❤️❤️` : aT, shoot.user.displayAvatarURL({ size: 128, format: "png", dynamic: true }))
            .setFooter((emb.footer.text ? emb.footer.text + "・" : "") + num + ` ${name} from ` + shoot.displayName + " ❤️");
        return emb;
    } else {
        return "ERROR 404 partner not found <:yeLife:796401669188354090>";
    }
}