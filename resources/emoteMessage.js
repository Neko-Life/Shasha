'use strict';

module.exports = function emoteMessage(client, content) {
    const emotes = content.match(/(?<![<a]):\w{1,32}:(?!\d{17,19}>)/g);
    if (emotes?.length > 0) {
        let theEmotes = [];
        for (const emoteName of emotes) {
            let findThis = emoteName.slice(1, -1);
            const findEmote = client.emojis.cache.array();
            let found;
            for (const emote of findEmote) {
                if (emote.name.toLowerCase() === findThis.toLowerCase()) {
                    found = emote;
                    break;
                }
            }
            theEmotes.push(found);
        }
        if (theEmotes.length > 0) {
            for (let index = 0; index < emotes.length; index++) {
                if (theEmotes[index]) {
                    content = content.replace(emotes[index], `<${theEmotes[index].animated ? "a" : ""}:${theEmotes[index].name}:${theEmotes[index].id}>`);
                }
            }
        }
    }
    return content;
}