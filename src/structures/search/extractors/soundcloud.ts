import { User } from "discord.js";

import SearchResult from "../SearchResult";
import { AudioMediaType } from "../../../utils/constants";

/**
 * Searches a query on SoundCloud.
 * Defaults type: null, count: 5, requester: null.
 * @param query 
 * @param options 
 * @async
 * @returns
 */
export async function searchSoundCloud(
    query: string,
    options?: { type?: AudioMediaType, count?: number, requester?: User | null }
): Promise<SearchResult> {
    throw new Error("Not Currently Supported");
}

/**
 * Searches a SoundCloud URL.
 * Defaults requester: null
 * @param url 
 * @param type 
 * @async
 * @returns
 */
export async function searchSoundCloudURL(url: string, options?: { requester?: User | null }): Promise<SearchResult> {
    throw new Error("Not Currently Supported");
}