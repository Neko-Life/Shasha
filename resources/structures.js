'use strict';

const { Structures } = require("discord.js");

class Settings {
    constructor(client, type, id) {
        this.client = client;
        this.type = type;
        this.id = id;
    }
    
    get(setting) {
        collection(this.type).findOne({ id: this.id })[setting];
    }
}

Structures.extend("Guild", Guild => {
    return class GuildSettings extends Guild {
        constructor(client, data) {
            super(client, data);
            this.settings = new Settings(client, "Guild", this.id);
        }
        embed = {
            footer: {
                text: undefined,
                icon: undefined
            },
            timestamp: false
        };
        moderation = {
            mute: {
                role: undefined,
                duration: {
                    date: undefined,
                    string: undefined
                },
                log: undefined,
                publicLog: undefined
            },
            ban: {
                duration: {
                    date: undefined,
                    string: undefined
                },
                log: undefined,
                publicLog: undefined
            },
            kick: {
                log: undefined,
                publicLog: undefined
            }
        }
    }
});

Structures.extend("User", User => {
    return class Settings extends User {
        constructor(client, data) {
            super(client, data);
            this.settings = new Settings(client, User, this.id);
        }
        embed = {
            footer: {
                text: undefined,
                icon: undefined
            },
            timestamp: false
        };
    }
});