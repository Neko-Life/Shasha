import { ShaGuild, ShaGuildMember } from "./typins";
import { ShaDbCollectionType } from "./classes/Database";

export declare function loadDb(instance: ShaGuild, collection: "guild/${guild.id}"): ShaGuild;
export declare function loadDb(instance: ShaGuildMember, collection: "member/${guild.id}/${member.id}"): ShaGuildMember;