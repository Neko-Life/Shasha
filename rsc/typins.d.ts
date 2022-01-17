import { ApplicationCommandPermissions, BaseGuildTextChannel, Collection, CommandInteraction, CommandInteractionOption, Guild, GuildMember, Message, User } from "discord.js";
import { AutocompleteCommandArgs, AutocompleteData } from "./classes/Command";
import { ShaBaseDb } from "./classes/Database";
import { MessageConstruct } from "./classes/MessageConstruct";
import ShaClient from "./classes/ShaClient";
import { InviteTracker } from "./classes/InviteTracker";

export declare class ShaMessage extends Message {
    public readonly client: ShaClient;
    public buttonHandler: { [k: string]: () => Promise<void | boolean> };
    public deleteAfter: number;
    public readonly channel: ShaTextChannel;
    public messageLinkPreview: ShaMessage;
    public readonly guild: ShaGuild;
    public messageConstruct: MessageConstruct;
    public deleted: boolean;
}

export declare class ShaCommandInteraction extends CommandInteraction {
    public readonly client: ShaClient;
    public autocomplete: AutocompleteData;
    public commandResults: Array<Promise<ShaMessage | unknown> | ShaMessage | unknown>;
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
    public db: ShaBaseDb;
}

export declare class ShaGuild extends Guild {
    public readonly client: ShaClient;
    public messageLinkPreviewSettings: { state: boolean };
    public db: ShaBaseDb;
    public commandPermissions: ApplicationCommandPermissions[];
}

export declare class ShaGuildMember extends GuildMember {
    public readonly client: ShaClient;
    public db: ShaBaseDb;
    public guild: ShaGuild;
}

export declare class ShaTextChannel extends BaseGuildTextChannel {
    public deletedMessages: Collection<string, ShaMessage>;
}