import { User } from "discord.js";
import YouTube, { Video, Playlist as _Playlist } from "youtube-sr";

import SearchResult from "../SearchResult";
import LiveStream from "../../models/LiveStream";
import Playlist from "../../models/Playlist";
import Track from "../../models/Track";
import { AudioMediaSource, AudioMediaType, SearchResultType, YOUTUBE_REGEX } from "../../../utils/constants";

/**
 * Searches a query on YouTube.
 * Defaults type: null, count: 1, requester: null.
 * @param query 
 * @param options 
 * @async
 * @returns
 */
export async function searchYouTube(
    query: string,
    options?: { type?: AudioMediaType | null, count?: number, requester?: User | null }
): Promise<SearchResult> {
    const type = options?.type ?? null;
    const count = options?.count ?? 1;
    const requester = options?.requester ?? null;

    let items = [];

    try {

        if (!type) {
            const data = await YouTube.search(query, { type: "all", limit: count });

            if (!data.length) {
                return {
                    type: SearchResultType.NO_RESULTS,
                    source: AudioMediaSource.YOUTUBE,
                    requester: requester,
                    items: []
                }
            }

            for (let i = 0; i < data.length; i++) {
                if (data[i].type === "video") {
                    const video = data[i] as Video;

                    if (video.live || video.duration === 0) items.push(createLiveStream(video, requester));
                    else items.push(createTrack(video, requester));
                }
                else if (data[i].type === "playlist") items.push(createPlaylist(data[i] as _Playlist, requester));
                else continue;
            }
        }
        else if (type === AudioMediaType.LIVE_STREAM || type === AudioMediaType.TRACK) {
            const data = await YouTube.search(query, { type: "video", limit: count });

            if (!data.length) {
                return {
                    type: SearchResultType.NO_RESULTS,
                    source: AudioMediaSource.YOUTUBE,
                    requester: requester,
                    items: []
                }
            }

            if (type === AudioMediaType.LIVE_STREAM) {
                for (let i = 0; i < data.length; i++) {
                    items.push(createLiveStream(data[i], requester));
                }
            }
            else {
                for (let i = 0; i < data.length; i++) {
                    items.push(createTrack(data[i], requester));
                }
            }
        }
        else if (type === AudioMediaType.PLAYLIST) {
            const data = await YouTube.search(query, { type: "playlist", limit: count });

            if (!data.length) {
                return {
                    type: SearchResultType.NO_RESULTS,
                    source: AudioMediaSource.YOUTUBE,
                    requester: requester,
                    items: []
                }
            }

            for (let i = 0; i < data.length; i++) {
                items.push(createPlaylist(data[i], requester));
            }
        }
        else {
            return {
                type: SearchResultType.NO_RESULTS,
                source: AudioMediaSource.YOUTUBE,
                requester: requester,
                items: []
            };
        }
    }
    catch (e) {
        console.error(e);

        return {
            type: SearchResultType.ERROR,
            source: AudioMediaSource.YOUTUBE,
            requester: requester,
            items: []
        };
    }

    return {
        type: SearchResultType.RESULTS,
        source: AudioMediaSource.YOUTUBE,
        requester: requester,
        items: items
    }
}

/**
 * Searches a YouTube url.
 * Defaults requester: null.
 * @param url 
 * @param options
 * @async
 * @returns
 */
export async function searchYouTubeURL(url: string, options?: { requester?: User | null }): Promise<SearchResult> {
    const requester = options?.requester ?? null;

    let item;

    try {
        if (url.match(YOUTUBE_REGEX.PLAYLIST)) {
            const data = await YouTube.getPlaylist(url);

            if (!data) {
                return {
                    type: SearchResultType.NOT_FOUND,
                    source: AudioMediaSource.YOUTUBE,
                    requester: requester,
                    items: []
                }
            }

            item = createPlaylist(data, requester);
        }
        else if (url.match(YOUTUBE_REGEX.VIDEO)) {
            const data = await YouTube.getVideo(url);

            if (!data) {
                return {
                    type: SearchResultType.NOT_FOUND,
                    source: AudioMediaSource.YOUTUBE,
                    requester: requester,
                    items: []
                }
            }

            if (data.live || data.duration === 0) item = createLiveStream(data, requester);
            else item = createTrack(data, requester);
        }
        else {
            return {
                type: SearchResultType.NOT_FOUND,
                source: AudioMediaSource.YOUTUBE,
                requester: requester,
                items: []
            }
        }
    }
    catch (e) {
        console.error(e);

        return {
            type: SearchResultType.ERROR,
            source: AudioMediaSource.YOUTUBE,
            requester: requester,
            items: []
        }
    }

    return {
        type: SearchResultType.FOUND,
        source: AudioMediaSource.YOUTUBE,
        requester: requester,
        items: [item]
    }
}

function createLiveStream(data: Video, requester: User | null): LiveStream {
    return new LiveStream(
        AudioMediaSource.YOUTUBE,
        requester,
        data.url,
        data.title!,
        [
            {
                url: data.channel?.url,
                name: data.channel?.name ?? "undefined",
                imageURL: data.channel?.icon.url
            }
        ],
        data.thumbnail?.url ?? null,
    )
}

function createPlaylist(data: _Playlist, requester: User | null): Playlist {
    const tracks: Track[] = [];

    for (let i = 0; i < data.videos.length; i++) {
        tracks.push(createTrack(data.videos[i], requester));
    }

    return new Playlist(
        AudioMediaSource.YOUTUBE,
        requester,
        data.url!,
        data.title!,
        {
            url: data.channel?.url,
            name: data.channel?.name ?? "undefined",
            imageURL: data.channel?.icon.url
        },
        data.thumbnail?.url ?? null,
        tracks
    );
}

function createTrack(data: Video, requester: User | null): Track {
    return new Track(
        AudioMediaSource.YOUTUBE,
        requester,
        data.url,
        data.title!,
        [
            {
                url: data.channel?.url,
                name: data.channel?.name ?? "undefined",
                imageURL: data.channel?.icon.url
            }
        ],
        null,
        data.thumbnail!.url ?? null,
        data.duration
    );
}