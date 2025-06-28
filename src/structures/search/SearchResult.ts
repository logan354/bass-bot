import { User } from "discord.js";

import { AudioMedia } from "../AudioMedia";
import { AudioMediaSource, SearchResultType } from "../../utils/constants";

export default interface SearchResult {
    type: SearchResultType;

    source?: AudioMediaSource;

    requester: User | null;

    items: AudioMedia[];
}