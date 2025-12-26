import { User } from "discord.js";

import SearchResult from "./SearchResult";
import { searchSoundCloud, searchSoundCloudURL } from "./extractors/soundcloud";
import { searchSpotifyURL } from "./extractors/spotify";
import { searchYouTube, searchYouTubeURL } from "./extractors/youtube";
import { searchYouTubeMusicURL } from "./extractors/youtubeMusic";
import { AudioMediaSource, AudioMediaType, BASE_SOUNDCLOUD_REGEX, BASE_SPOTIFY_REGEX, BASE_YOUTUBE_MUSIC_REGEX, BASE_YOUTUBE_REGEX, DEFAULT_SEARCH_COUNT, SearchResultType } from "../../utils/constants";

export const URLType = {
    YOUTUBE: "YOUTUBE",
    YOUTUBE_MUSIC: "YOUTUBE_MUSIC",
    SPOTIFY: "SPOTIFY",
    SOUNDCLOUD: "SOUNDCLOUD"
} as const;

export type URLType = keyof typeof URLType;

/**
 * Searches a query.
 * Defaults type: track, count: 5, requester: null.
 * @param query 
 * @param source 
 * @async
 * @returns 
 */
export async function search(query: string, source: AudioMediaSource, options?: { type?: AudioMediaType, count?: number, requester?: User | null }): Promise<SearchResult> {
    const type = options?.type ?? null;
    const count = options?.count ?? DEFAULT_SEARCH_COUNT;
    const requester = options?.requester ?? null;

    if (source === AudioMediaSource.YOUTUBE) return await searchYouTube(query, options);
    else if (source === AudioMediaSource.SOUNDCLOUD) return await searchSoundCloud(query, options);
    else {
        return {
            type: SearchResultType.NO_RESULTS,
            requester: requester,
            items: [],
        }
    }
}

/**
 * Searches a url.
 * Defaults requester: null.
 * @param url 
 * @async
 * @returns
 */
export async function searchURL(url: string, options?: { requester?: User | null }): Promise<SearchResult> {
    const requester = options?.requester ?? null;

    const urlType = resolveURLType(url);

    switch (urlType) {
        case URLType.YOUTUBE: return await searchYouTubeURL(url, options);
        case URLType.YOUTUBE_MUSIC: return await searchYouTubeMusicURL(url, options);
        case URLType.SPOTIFY: return await searchSpotifyURL(url, options);
        case URLType.SOUNDCLOUD: return await searchSoundCloudURL(url, options);
        default: {
            return {
                type: SearchResultType.NOT_FOUND,
                requester: requester,
                items: []
            }
        }
    }
}

/**
 * Resolves the url type, if one exists.
 * @param url 
 * @returns 
 */
export function resolveURLType(url: string): URLType | undefined {
    if (url.match(BASE_YOUTUBE_REGEX)) return URLType.YOUTUBE;
    else if (url.match(BASE_YOUTUBE_MUSIC_REGEX)) return URLType.YOUTUBE_MUSIC
    else if (url.match(BASE_SPOTIFY_REGEX)) return URLType.SPOTIFY;
    else if (url.match(BASE_SOUNDCLOUD_REGEX)) return URLType.SOUNDCLOUD;
    else return undefined;
}