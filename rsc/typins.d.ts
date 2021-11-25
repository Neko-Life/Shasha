import { CommandInteractionOption, Interaction, Message, User } from "discord.js";
import { AutocompleteCommandArgs, AutocompleteData } from "./classes/Command";
import ShaClient from "./classes/ShaClient";

export declare class ShaMessage extends Message {
    public buttonHandler: { [k: string]: () => Promise<void> };
    public deleteAfter: number;
    public readonly client: ShaClient;
}

export declare class ShaInteraction extends Interaction {
    public autocomplete: AutocompleteData;
    public commandResults: Array<Promise<Message | unknown> | Message | unknown>;
    public commandPath: Array<string>;
    public readonly client: ShaClient;
    public user: ShaUser;
    public message: ShaMessage;
    public args: { [k: string]: CommandInteractionOption }
}

interface UserLastAutocomplete {
    autocomplete: AutocompleteData;
    commandPath: string;
    db: AutocompleteCommandArgs;
}

export declare class ShaUser extends User {
    public lastAutocomplete: UserLastAutocomplete;
    public autocomplete: { [k: string]: AutocompleteData };
}