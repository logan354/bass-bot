import { User } from "discord.js";
import YouTube, { Video, Playlist as _Playlist } from "youtube-sr";

import { AudioMedia } from "../../AudioMedia";
import SearchResult from "../SearchResult";
import Playlist from "../../models/Playlist";
import Track from "../../models/Track";
import { AudioMediaSource, AudioMediaType, DEFAULT_SEARCH_COUNT, SearchResultType, YOUTUBE_ICON_URL, YOUTUBE_REGEX, YOUTUBE_URL } from "../../../utils/constants";

/**
 * Searches a query on YouTube.
 * Defaults type: null, count: 5, requester: null.
 * @param query 
 * @param options 
 * @returns
 */
export async function searchYouTube(
    query: string,
    options?: { type?: AudioMediaType | null, count?: number, requester?: User | null }
): Promise<SearchResult> {
    let type = null;
    let count = DEFAULT_SEARCH_COUNT;
    let requester = null;

    if (options) {
        if (options.type) type = options.type;
        if (options.count) count = options.count;
        if (options.requester) requester = options.requester;
    }

    const items: AudioMedia[] = [];

    if (!type) {
        const data = await YouTube.search(query, { type: "all", limit: count });

        if (!data.length) {
            return {
                type: SearchResultType.NO_RESULTS,
                source: AudioMediaSource.YOUTUBE,
                items: [],
                requester: requester
            } as SearchResult;
        }

        for (let i = 0; i < data.length; i++) {
            if (data[i].type === "video") {
                const track = createTrack(requester, data[i] as Video);
                items.push(track);
            }
            else if (data[i].type === "playlist") {
                const playlist = createPlaylist(requester, data[i] as _Playlist);
                items.push(playlist);
            }
            else continue;
        }
    }
    else if (type === AudioMediaType.TRACK) {
        const data = await YouTube.search(query, { type: "video", limit: count });

        if (!data.length) {
            return {
                type: SearchResultType.NO_RESULTS,
                source: AudioMediaSource.YOUTUBE,
                items: [],
                requester: requester
            } as SearchResult;
        }

        for (let i = 0; i < data.length; i++) {
            const track = createTrack(requester, data[i])
            items.push(track);
        }
    }
    else if (type === AudioMediaType.PLAYLIST) {
        const data = await YouTube.search(query, { type: "playlist", limit: count });

        if (!data.length) {
            return {
                type: SearchResultType.NO_RESULTS,
                source: AudioMediaSource.YOUTUBE,
                items: [],
                requester: requester
            } as SearchResult;
        }

        for (let i = 0; i < data.length; i++) {
            const playlist = createPlaylist(requester, data[i]);
            items.push(playlist);
        }
    }
    else {
        return {
            type: SearchResultType.NO_RESULTS,
            source: AudioMediaSource.YOUTUBE,
            items: [],
            requester: requester
        } as SearchResult;
    }

    return {
        type: SearchResultType.RESULTS,
        source: AudioMediaSource.YOUTUBE,
        items: items,
        requester: requester
    } as SearchResult;
}

/**
 * Searches a YouTube URL
 * Defaults requester: null
 * @param url 
 * @param options
 * @returns
 */
export async function searchYouTubeURL(url: string, options?: { requester?: User | null }): Promise<SearchResult> {
    let requester = null;

    if (options) {
        if (options.requester) requester = options.requester;
    }

    if (url.match(YOUTUBE_REGEX.VIDEO)) {
        const data = await YouTube.getVideo(url);

        if (!data) {
            return {
                type: SearchResultType.NOT_FOUND,
                source: AudioMediaSource.YOUTUBE,
                items: [],
                requester: requester
            } as SearchResult;
        }

        const track = createTrack(requester, data);

        return {
            type: SearchResultType.FOUND,
            source: AudioMediaSource.YOUTUBE,
            items: [track],
            requester: requester
        } as SearchResult;
    }
    else if (url.match(YOUTUBE_REGEX.PLAYLIST)) {
        const data = await YouTube.getPlaylist(url);

        if (!data) {
            return {
                type: SearchResultType.NOT_FOUND,
                source: AudioMediaSource.YOUTUBE,
                items: [],
                requester: requester
            } as SearchResult;
        }

        const playlist = createPlaylist(requester, data);

        return {
            type: SearchResultType.FOUND,
            source: AudioMediaSource.YOUTUBE,
            items: [playlist],
            requester: requester
        } as SearchResult;
    }
    else {
        return {
            type: SearchResultType.NOT_FOUND,
            source: AudioMediaSource.YOUTUBE,
            items: [],
            requester: requester
        } as SearchResult;
    }
}

function createTrack(requester: User | null, data: Video): Track {
    return new Track(
        AudioMediaSource.YOUTUBE,
        requester,
        data.url,
        data.title!,
        [
            {
                name: data.channel?.name!,
                url: data.channel!.url,
                imageURL: data.channel?.icon.url
            }
        ],
        null,
        data.thumbnail!.url ?? null,
        data.duration,
        data.live
    );
}

function createPlaylist(requester: User | null, data: _Playlist): Playlist {
    const tracks: Track[] = [];

    for (let i = 0; i < data.videos.length; i++) {
        const track = createTrack(requester, data.videos[i]);
        tracks.push(track);
    }

    return new Playlist(
        AudioMediaSource.YOUTUBE,
        requester,
        data.url!,
        data.title!,
        {
            name: data.channel!.name!,
            url: data.channel!.url,
            imageURL: data.channel!.icon.url
        },
        data.thumbnail!.url ?? null,
        tracks
    );
}