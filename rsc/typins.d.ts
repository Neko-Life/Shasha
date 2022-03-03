import { ApplicationCommandPermissions, BaseGuildTextChannel, ButtonInteraction, Collection, CommandInteraction, CommandInteractionOption, Guild, GuildChannel, GuildMember, Message, User } from "discord.js";
import { AutocompleteCommandArgs, AutocompleteData } from "./classes/Command";
import { ShaBaseDb } from "./classes/Database";
import { EmbedConstructor } from "./classes/EmbedConstructor";
import { MessageConstructor } from "./classes/MessageConstructor";
import ShaClient from "./classes/ShaClient";

export declare class ShaMessage extends Message {
    public readonly client: ShaClient;
    public buttonHandler: { [k: string]: () => Promise<void | boolean> };
    public deleteAfter: number;
    public readonly channel: ShaTextChannel;
    public messageLinkPreview: ShaMessage;
    public readonly guild: ShaGuild;
    public messageConstruct: MessageConstructor;
    public embedConstruct: EmbedConstructor;
    public deleted: boolean;
    public db: ShaBaseDb;
}

export declare class ShaCommandInteraction extends CommandInteraction {
    public readonly client: ShaClient;
    public autocomplete: AutocompleteData;
    public commandResults: Array<Promise<ShaMessage | unknown> | ShaMessage | unknown>;
    public commandPath: Array<string>;
    public user: ShaUser;
    public member: ShaGuildMember;
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
    public commandPermissions: { [commandId: string]: ApplicationCommandPermissions[] };
}

export declare class ShaGuildMember extends GuildMember {
    public readonly client: ShaClient;
    public db: ShaBaseDb;
    public guild: ShaGuild;
}

export declare class ShaTextChannel extends BaseGuildTextChannel {
    public deletedMessages: Collection<string, ShaMessage>;
}

export declare class ShaGuildChannel extends GuildChannel {
    public readonly client: ShaClient;
    public db: ShaBaseDb;
    public guild: ShaGuild;
}

export declare class ShaButtonInteraction extends ButtonInteraction {
    public readonly client: ShaClient;
    public user: ShaUser;
    public member: ShaGuildMember;
    public message: ShaMessage;
}