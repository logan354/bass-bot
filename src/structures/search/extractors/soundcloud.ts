import { User } from "discord.js";

import SearchResult from "../SearchResult";
import { AudioMediaType } from "../../../utils/constants";

/**
 * Searches a query on SoundCloud
 * @param query 
 * @param options 
 */
export async function searchSoundCloud(
    query: string,
    options?: { type?: AudioMediaType, count?: number, requester?: User | null },
): Promise<SearchResult> {
    throw new Error("Not Currently Supported");
}

/**
 * Searches a SoundCloud URL.
 * @param url 
 * @param type 
 */
export async function searchSoundCloudURL(url: string, options?: { requester?: User | null }): Promise<SearchResult> {
    throw new Error("Not Currently Supported");
}