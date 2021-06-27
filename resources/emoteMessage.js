'use strict';

module.exports = function emoteMessage(client, content) {
    const E = content?.match(/:\w{1,32}:(?!\d{17,19}>)/g);
    if (!E || E.length === 0) return content;
    let tE = [];
    for (const eN of E) {
        let findThis = eN.slice(1, -1);
        let found = client.emojis.cache.map(r => r).filter(r => r.name.toLowerCase() === findThis.toLowerCase())?.[0];
        tE.push(found);
    }
    if (tE.length > 0) {
        for (let index = 0; index < E.length; index++) {
            if (tE[index]) {
                content = content.replace(E[index], `<${tE[index].animated ? "a" : ""}:${tE[index].name}:${tE[index].id}>`);
            }
        }
    }
    return content;
}