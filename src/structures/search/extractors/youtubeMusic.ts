import { User } from "discord.js";

import SearchResult from "../SearchResult";

/**
 * Searches a YouTube Music URL.
 * Defaults to a null requester.
 * @param url 
 * @param options 
 * @returns 
 */
export async function searchYouTubeMusicURL(url: string, options?: { requester?: User | null }): Promise<SearchResult> {
    throw new Error("Not Currently Supported");
}