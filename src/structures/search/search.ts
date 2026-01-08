import { User } from "discord.js";

import SearchResult from "./SearchResult";
import { searchSoundCloud, searchSoundCloudURL } from "./extractors/soundcloud";
import { searchSpotifyURL } from "./extractors/spotify";
import { searchYouTube, searchYouTubeURL } from "./extractors/youtube";
import { searchYouTubeMusic, searchYouTubeMusicURL } from "./extractors/youtubeMusic";
import { AudioMediaSource, AudioMediaType, BASE_SOUNDCLOUD_REGEX, BASE_SPOTIFY_REGEX, BASE_YOUTUBE_MUSIC_REGEX, BASE_YOUTUBE_REGEX, SearchResultType } from "../../utils/constants";

/**
 * Searches a query.
 * Defaults type: track, count: 1, requester: null.
 * @param query 
 * @param source 
 * @async
 * @returns 
 */
export async function search(
    query: string, source: AudioMediaSource,
    options?: { type?: AudioMediaType, count?: number, requester?: User | null }
): Promise<SearchResult> {
    const requester = options?.requester ?? null;

    if (source === AudioMediaSource.YOUTUBE) return await searchYouTube(query, options);
    else if (source === AudioMediaSource.YOUTUBE_MUSIC) return await searchYouTubeMusic(query, options);
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

    if (url.match(BASE_YOUTUBE_REGEX)) return await searchYouTubeURL(url, options);
    else if (url.match(BASE_YOUTUBE_MUSIC_REGEX)) return await searchYouTubeMusicURL(url, options);
    else if (url.match(BASE_SPOTIFY_REGEX)) return await searchSpotifyURL(url, options);
    else if (url.match(BASE_SOUNDCLOUD_REGEX)) return await searchSoundCloudURL(url, options);
    else {
        return {
            type: SearchResultType.NOT_FOUND,
            requester: requester,
            items: []
        }
    }
}