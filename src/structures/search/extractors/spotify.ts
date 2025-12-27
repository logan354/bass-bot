import { User } from "discord.js";
import fetch from "isomorphic-unfetch";
import { parse } from "spotify-uri";

// @ts-ignore
import spotifyUrlInfo from "spotify-url-info";

import SearchResult from "../SearchResult";
import { AudioMedia } from "../../AudioMedia";
import Album from "../../models/Album";
import Playlist from "../../models/Playlist";
import Track from "../../models/Track";
import { AudioMediaSource, SearchResultType, SPOTIFY_REGEX } from "../../../utils/constants";

const spotify = spotifyUrlInfo(fetch);

/**
 * Searches a Spotify url.
 * Defaults requester: null.
 * @param url 
 * @param options
 * @async
 * @returns
 */
export async function searchSpotifyURL(url: string, options?: { requester?: User | null }): Promise<SearchResult> {
    const requester = options?.requester ?? null;

    const items: AudioMedia[] = [];

    try {
        const data = await spotify.getData(url);

        console.log(data)

        if (url.match(SPOTIFY_REGEX.TRACK)) items.push(createTrack(data, requester));
        else if (url.match(SPOTIFY_REGEX.PLAYLIST)) items.push(createPlaylist(data, requester));
        else if (url.match(SPOTIFY_REGEX.ALBUM)) items.push(createAlbum(data, requester));
        else {
            return {
                type: SearchResultType.NOT_FOUND,
                source: AudioMediaSource.SPOTIFY,
                requester,
                items: []
            }
        }
    }
    catch (e) {
        console.error(e);

        return {
            type: SearchResultType.ERROR,
            source: AudioMediaSource.SPOTIFY,
            requester,
            items: []
        }
    }

    return {
        type: SearchResultType.FOUND,
        source: AudioMediaSource.SPOTIFY,
        requester: requester,
        items: items
    }
}

function createAlbum(data: any, requester: User | null): Album {
    const tracks = [];

    for (let i = 0; i < data.trackList.length; i++) {
        const track = new Track(
            AudioMediaSource.SPOTIFY,
            requester,
            parse(data.trackList[i].uri).toOpenURL(),
            data.trackList[i].title,
            data.trackList[i].subtitle.split(", ").map((x: any) => {
                return {
                    url: null,
                    name: x,
                    imageURL: null
                }
            }),
            {
                url: parse(data.uri).toOpenURL(),
                title: data.title,
                coverArtURL: data.visualIdentity.image[0].url
            },
            null,
            data.trackList[i].duration
        );

        tracks.push(track);
    }

    return new Album(
        AudioMediaSource.SPOTIFY,
        requester,
        parse(data.uri).toOpenURL(),
        data.title,
        data.subtitle.split(", ").map((x: any) => {
            return {
                url: null,
                name: x,
                imageURL: null
            }
        }),
        data.visualIdentity.image[0].url,
        tracks
    );
}

function createPlaylist(data: any, requester: User | null): Playlist {
    const tracks = [];

    for (let i = 0; i < data.trackList.length; i++) {
        const track = new Track(
            AudioMediaSource.SPOTIFY,
            requester,
            parse(data.trackList[i].uri).toOpenURL(),
            data.trackList[i].title,
            data.trackList[i].subtitle.split(", ").map((x: any) => {
                return {
                    url: null,
                    name: x,
                    imageURL: null
                }
            }),
            null,
            null,
            data.trackList[i].duration
        );

        tracks.push(track);
    }

    return new Playlist(
        AudioMediaSource.SPOTIFY,
        requester,
        parse(data.uri).toOpenURL(),
        data.title,
        data.subtitle.split(", ").map((x: any) => {
            return {
                name: x,
                url: null,
                imageURL: null
            }
        }),
        data.visualIdentity.image[0].url,
        tracks
    );
}

function createTrack(data: any, requester: User | null): Track {
    return new Track(
        AudioMediaSource.SPOTIFY,
        requester,
        parse(data.uri).toOpenURL(),
        data.title,
        data.artists.map((x: any) => {
            return {
                url: parse(x.uri).toOpenURL(),
                name: x.name,
                imageURL: null
            }
        }),
        null,
        data.visualIdentity.image[0].url,
        data.duration
    );
}
