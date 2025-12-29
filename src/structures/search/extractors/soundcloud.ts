import { User } from "discord.js";
import ytdl from "youtube-dl-exec";

import SearchResult from "../SearchResult";
import { AudioMediaSource, AudioMediaType, SearchResultType, SOUNDCLOUD_REGEX } from "../../../utils/constants";
import Track from "../../models/Track";

/**
 * Searches a query on SoundCloud.
 * Defaults type: TRACK, count: 1, requester: null.
 * @param query 
 * @param options 
 * @async
 * @returns
 */
export async function searchSoundCloud(
    query: string,
    options?: { type?: AudioMediaType, count?: number, requester?: User | null }
): Promise<SearchResult> {
    const type = options?.type ?? AudioMediaType.TRACK;
    const count = options?.count ?? 1;
    const requester = options?.requester ?? null;

    let items = [];

    try {
        if (type === AudioMediaType.TRACK) {
            const data = await ytdl.exec(
                `scsearch${count.toString()}:${query}`,
                {
                    dumpSingleJson: true,
                    flatPlaylist: true
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
                source: AudioMediaSource.SOUNDCLOUD,
                requester: requester,
                items: []
            };
        }
    }
    catch (e: any) {
        if (e.stderr?.includes("404")) {
            return {
                type: SearchResultType.NO_RESULTS,
                source: AudioMediaSource.SOUNDCLOUD,
                requester: requester,
                items: []
            }
        }
        else {
            console.error(e);

            return {
                type: SearchResultType.ERROR,
                source: AudioMediaSource.SOUNDCLOUD,
                requester: requester,
                items: []
            }
        }
    }

    return {
        type: SearchResultType.RESULTS,
        source: AudioMediaSource.SOUNDCLOUD,
        requester: requester,
        items: items
    }
}

/**
 * Searches a SoundCloud URL.
 * Defaults requester: null
 * @param url 
 * @param type 
 * @async
 * @returns
 */
export async function searchSoundCloudURL(url: string, options?: { requester?: User | null }): Promise<SearchResult> {
    const requester = options?.requester ?? null;

    let item;

    try {
        if (url.match(SOUNDCLOUD_REGEX.TRACK)) {
            const data = await ytdl.exec(
                url,
                {
                    dumpSingleJson: true
                }
            );

            const dataJSON = JSON.parse(data.stdout);

            item = createTrack(dataJSON, requester);
        }
        else {
            return {
                type: SearchResultType.NOT_FOUND,
                source: AudioMediaSource.SOUNDCLOUD,
                requester: requester,
                items: []
            }
        }
    }
    catch (e: any) {
        if (e.stderr?.includes("404")) {
            return {
                type: SearchResultType.NOT_FOUND,
                source: AudioMediaSource.SOUNDCLOUD,
                requester: requester,
                items: []
            }
        }
        else {
            console.error(e);

            return {
                type: SearchResultType.ERROR,
                source: AudioMediaSource.SOUNDCLOUD,
                requester: requester,
                items: []
            }
        }
    }

    return {
        type: SearchResultType.FOUND,
        source: AudioMediaSource.SOUNDCLOUD,
        requester: requester,
        items: [item]
    }
}

function createTrack(data: any, requester: User | null): Track {
    return new Track(
        AudioMediaSource.SOUNDCLOUD,
        requester,
        data.webpage_url,
        data.title,
        data.artists?.map((x: any) => {
            return {
                url: undefined,
                name: x,
                imageURL: undefined
            }
        }) ?? [{
            url: undefined,
            name: data.uploader_url,
            imageURL: undefined
        }],
        null,
        data.thumbnails[data.thumbnails.length - 1].url,
        data.duration * 1000
    );
}