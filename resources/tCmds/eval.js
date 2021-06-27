'use strict';

module.exports = {
    description: "Execute JS codes",
    aliases: ["e"],
    async run(client, arg) {
        return console.log(await eval(arg));
    }
}