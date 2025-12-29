import { User } from "discord.js";

import { searchYouTube, searchYouTubeURL } from "./youtube";
import SearchResult from "../SearchResult";
import { AudioMediaType } from "../../../utils/constants";

/**
 * Searches a query on YouTube Music.
 * Defaults type: TRACK, count: 1, requester: null.
 * @param query 
 * @param options 
 * @async
 * @returns
 */
export async function searchYouTubeMusic(
    query: string,
    options?: { type?: AudioMediaType, count?: number, requester?: User | null }
): Promise<SearchResult> {
    // Convert to standard youtube until proper extractor support
    return await searchYouTube(query, options);
}

/**
 * Searches a YouTube Music url.
 * Defaults requester: null.
 * @param url 
 * @param options 
 * @async
 * @returns 
 */
export async function searchYouTubeMusicURL(url: string, options?: { requester?: User | null }): Promise<SearchResult> {
    // Convert to standard youtube until proper extractor support
    return await searchYouTubeURL(url.replace("music.youtube.com", "www.youtube.com"), options);
}