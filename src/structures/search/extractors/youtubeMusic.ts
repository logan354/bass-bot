import { User } from "discord.js";

import { searchYouTubeURL } from "./youtube";
import SearchResult from "../SearchResult";

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