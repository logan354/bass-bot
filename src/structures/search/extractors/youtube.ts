import { User } from "discord.js";
import ytdl from "youtube-dl-exec";

import SearchResult from "../SearchResult";
import LiveStream from "../../models/LiveStream";
import Playlist from "../../models/Playlist";
import Track from "../../models/Track";
import { AudioMediaSource, AudioMediaType, SearchResultType, YOUTUBE_REGEX } from "../../../utils/constants";

/**
 * Searches a query on YouTube.
 * Defaults type: TRACK, count: 1, requester: null.
 * @param query 
 * @param options 
 * @async
 * @returns
 */
export async function searchYouTube(
    query: string,
    options?: { type?: AudioMediaType, count?: number, requester?: User | null }
): Promise<SearchResult> {
    const type = options?.type ?? AudioMediaType.TRACK;
    const count = options?.count ?? 1;
    const requester = options?.requester ?? null;

    let items = [];

    try {
        if (type === AudioMediaType.LIVE_STREAM) {
            const data = await ytdl.exec(
                "https://www.youtube.com/results?search_query=" + query + "&sp=EgJAAQ%253D%253D",
                {
                    dumpSingleJson: true,
                    flatPlaylist: true,
                    playlistEnd: count,
                }
            );

            const dataJSON = JSON.parse(data.stdout);

            for (let i = 0; i < dataJSON.entries.length; i++) {
                items.push(createLiveStream(dataJSON.entries[i], requester));
            }
        }
        else if (type === AudioMediaType.PLAYLIST) {
            const data = await ytdl.exec(
                "https://www.youtube.com/results?search_query=" + query + "&sp=EgIQAw%253D%253D",
                {
                    dumpSingleJson: true,
                    flatPlaylist: true,
                    playlistEnd: count,
                }
            );

            const dataJSON = JSON.parse(data.stdout);

            for (let i = 0; i < dataJSON.entries.length; i++) {
                const result = await searchYouTubeURL(dataJSON.entries[i].url);
                items.push(result.items[0]);
            }
        }
        else if (type === AudioMediaType.TRACK) {
            const data = await ytdl.exec(
                "https://www.youtube.com/results?search_query=" + query + "&sp=EgIQAQ%253D%253D",
                {
                    dumpSingleJson: true,
                    flatPlaylist: true,
                    playlistEnd: count,
                }
            );

            const dataJSON = JSON.parse(data.stdout);

            for (let i = 0; i < dataJSON.entries.length; i++) {
                items.push(createTrack(dataJSON.entries[i], requester));
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
    catch (e: any) {
        if (e.stderr.includes("404")) {
            return {
                type: SearchResultType.NOT_FOUND,
                source: AudioMediaSource.YOUTUBE,
                requester: requester,
                items: []
            }
        }
        else {
            console.error(e);

            return {
                type: SearchResultType.ERROR,
                source: AudioMediaSource.YOUTUBE,
                requester: requester,
                items: []
            }
        }
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
            const data = await ytdl.exec(
                url,
                {
                    dumpSingleJson: true,
                    flatPlaylist: true
                }
            );

            const dataJSON = JSON.parse(data.stdout);

            item = createPlaylist(dataJSON, requester);
        }
        else if (url.match(YOUTUBE_REGEX.VIDEO)) {
            const data = await ytdl.exec(
                "https://www.youtube.com/results?search_query=" + url,
                {
                    dumpSingleJson: true,
                    flatPlaylist: true,
                    playlistEnd: 1
                }
            );

            const dataJSON = JSON.parse(data.stdout);

            if (dataJSON.live_status === "is_live") item = createLiveStream(dataJSON.entries[0], requester);
            else item = createTrack(dataJSON.entries[0], requester);
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
    catch (e: any) {
        if (e.stderr.includes("404")) {
            return {
                type: SearchResultType.NOT_FOUND,
                source: AudioMediaSource.YOUTUBE,
                requester: requester,
                items: []
            }
        }
        else {
            console.error(e);

            return {
                type: SearchResultType.ERROR,
                source: AudioMediaSource.YOUTUBE,
                requester: requester,
                items: []
            }
        }
    }

    return {
        type: SearchResultType.FOUND,
        source: AudioMediaSource.YOUTUBE,
        requester: requester,
        items: [item]
    }
}

function createLiveStream(data: any, requester: User | null): LiveStream {
    return new LiveStream(
        AudioMediaSource.YOUTUBE,
        requester,
        data.url,
        data.title,
        [
            {
                url: data.channel_url,
                name: data.channel,
                imageURL: undefined
            }
        ],
        data.thumbnails[0].url,
    )
}

function createPlaylist(data: any, requester: User | null): Playlist {
    const tracks = [];

    for (let i = 0; i < data.entries.length; i++) {
        tracks.push(createTrack(data.entries[i], requester));
    }

    return new Playlist(
        AudioMediaSource.YOUTUBE,
        requester,
        data.webpage_url,
        data.title,
        {
            url: data.channel_url,
            name: data.channel,
            imageURL: undefined
        },
        data.thumbnails[0].url,
        tracks
    );
}

function createTrack(data: any, requester: User | null): Track {
    return new Track(
        AudioMediaSource.YOUTUBE,
        requester,
        data.url,
        data.title,
        [
            {
                url: data.channel_url ?? undefined,
                name: data.channel ?? "undefined",
                imageURL: undefined
            }
        ],
        null,
        data.thumbnails[0].url,
        data.duration * 1000
    );
}