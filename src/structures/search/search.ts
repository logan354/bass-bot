import { User } from "discord.js";

import SearchResult from "./SearchResult";
import { searchSpotifyURL } from "./extractors/spotify";
import { searchSoundCloud, searchSoundCloudURL } from "./extractors/soundcloud";
import { searchYouTube, searchYouTubeURL } from "./extractors/youtube";
import { AudioMediaSource, AudioMediaType, BASE_SOUNDCLOUD_REGEX, BASE_SPOTIFY_REGEX, BASE_YOUTUBE_REGEX, DEFAULT_SEARCH_COUNT, SearchResultType } from "../../utils/constants";

export const URLType = {
    YOUTUBE: "YOUTUBE",
    SPOTIFY: "SPOTIFY",
    SOUNDCLOUD: "SOUNDCLOUD"
} as const;

export type URLType = keyof typeof URLType;

/**
 * Resolves the url type, if one exists
 * @param url 
 * @returns 
 */
export function resolveURLType(url: string): URLType | undefined {
    if (url.match(BASE_YOUTUBE_REGEX)) return URLType.YOUTUBE;
    else if (url.match(BASE_SPOTIFY_REGEX)) return URLType.SPOTIFY;
    //else if (url.match(BASE_SOUNDCLOUD_REGEX)) return URLType.SOUNDCLOUD;
    else return undefined;
}

/**
 * Searches a query.
 * Defaults to track, 5 results, and a null requester.
 * @param query 
 * @param source 
 * @async
 * @returns 
 */
export async function search(query: string, source: AudioMediaSource, options?: { type?: AudioMediaType, count?: number, requester?: User | null }): Promise<SearchResult> {
    let type: AudioMediaType = AudioMediaType.TRACK;
    let count = DEFAULT_SEARCH_COUNT;
    let requester = null;

    if (options) {
        if (options.type) type = options.type;
        if (options.count) count = options.count
        if (options.requester) requester = options.requester;
    }

    if (source === AudioMediaSource.YOUTUBE) return await searchYouTube(query, options);
    else if (source === AudioMediaSource.SOUNDCLOUD) return await searchSoundCloud(query, options);
    else {
        return {
            type: SearchResultType.NO_RESULTS,
            items: [],
            requester: requester
        } as SearchResult;
    }
}

/**
 * Searches a URL.
 * Defaults to a null requester.
 * @param url 
 * @async
 * @returns
 */
export async function searchURL(url: string, options?: { requester?: User | null }): Promise<SearchResult> {
    let requester = null;

    if (options && options.requester) requester = options.requester;

    const urlType = resolveURLType(url);

    switch (urlType) {
        case URLType.YOUTUBE: {
            return await searchYouTubeURL(url, options);
        }
        case URLType.SPOTIFY: {
            return await searchSpotifyURL(url, options);
        }
        case URLType.SOUNDCLOUD: {
            return await searchSoundCloudURL(url, options);
        }
        default: {
            return {
                type: SearchResultType.NOT_FOUND,
                items: [],
                requester: requester
            } as SearchResult;
        }
    }
}