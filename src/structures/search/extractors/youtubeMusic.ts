import { User } from "discord.js";

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
    throw new Error("Not Currently Supported");
}