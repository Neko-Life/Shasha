import { CommandInteraction, CommandInteractionOption, Guild, GuildMember, Message, User } from "discord.js";
import { AutocompleteCommandArgs, AutocompleteData } from "./classes/Command";
import { ShaBaseDb } from "./classes/Database";
import ShaClient from "./classes/ShaClient";

export declare class ShaMessage extends Message {
    public readonly client: ShaClient;
    public buttonHandler: { [k: string]: () => Promise<void | boolean> };
    public deleteAfter: number;
}

export declare class ShaCommandInteraction extends CommandInteraction {
    public readonly client: ShaClient;
    public autocomplete: AutocompleteData;
    public commandResults: Array<Promise<Message | unknown> | Message | unknown>;
    public commandPath: Array<string>;
    public user: ShaUser;
    public message: ShaMessage;
    public args: { [k: string]: CommandInteractionOption };
    public guild: ShaGuild;
}

interface UserLastAutocomplete {
    autocomplete: AutocompleteData;
    commandPath: string;
    db: AutocompleteCommandArgs;
}

export declare class ShaUser extends User {
    public readonly client: ShaClient;
    public lastAutocomplete: UserLastAutocomplete;
    public autocomplete: { [k: string]: AutocompleteData };
    db: ShaBaseDb;
}

export declare class ShaGuild extends Guild {
    public readonly client: ShaClient;
    db: ShaBaseDb;
}

export declare class ShaGuildMember extends GuildMember {
    public readonly client: ShaClient;
    public db: ShaBaseDb;
}