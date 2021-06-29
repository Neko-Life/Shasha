'use strict';

const configFile = require("../../config.json");
const { trySend, noPerm } = require("../functions");
const { chatAnswer } = require("../shaChat");

function giveNickHeart(msg) {
    if (/(?<!(remove|dont|don't|no|neve).*)(giv|put).*(heart|nick).*(nick|heart)/i.test(msg.content) && !msg.member.displayName?.endsWith("<3")) {
        return msg.member.setNickname(msg.member.displayName + " <3")
            .then(r => {
                if (r) return trySend(msg.client, msg, "YES! <3 <3");
            })
            .catch(e => noPerm(msg));
    }
    if (/(dont|don't|no|neve|remove).*(giv|put)?.*(heart|nick).*(nick|heart)/i.test(msg.content) && msg.member.displayName?.endsWith(" <3")) {
        return msg.member.setNickname(msg.member.displayName.slice(0, -3))
            .then(r => {
                if (r) return trySend(msg.client, msg, "okay <3");
            })
            .catch(e => noPerm(msg));
    }
}

async function letsChat(msg) {
    if (msg.channel.id === configFile.chatChannel && !msg.author.bot && !msg.isCommand && msg.cleanContent.length > 0) {
        msg.channel.startTyping();
        return trySend(msg.client, msg, await chatAnswer(msg.cleanContent));
    }
}

function run(msg) {
    msg.channel.pushLastMessagesID();
}

module.exports = { letsChat, giveNickHeart, run }