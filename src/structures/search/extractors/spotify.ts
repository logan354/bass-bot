import { User } from "discord.js";
import fetch from 'isomorphic-unfetch';

// @ts-ignore
import spotifyUrlInfo from 'spotify-url-info';

import { parse } from "spotify-uri";

import Track, { Album as TrackAlbum } from "../../models/Track";
import Playlist from "../../models/Playlist";
import SearchResult from "../SearchResult";
import { AudioMediaSource, AudioMediaType, SearchResultType, SPOTIFY_REGEX } from "../../../utils/constants";
import { AudioMedia } from "../../AudioMedia";
import Album from "../../models/Album";

const spotify = spotifyUrlInfo(fetch);

/**
 * Searches a Spotify URL.
 * Defaults requester: null
 * @param url 
 * @param options
 * @returns
 */
export async function searchSpotifyURL(url: string, options?: { requester?: User | null }): Promise<SearchResult> {
    let requester = null;

    if (options) {
        if (options.requester) requester = options.requester;
    }

    const items: AudioMedia[] = []

    if (url.match(SPOTIFY_REGEX.TRACK)) {
        const data = await spotify.getData(url);

        if (!data) return {
            type: SearchResultType.NOT_FOUND,
            source: AudioMediaSource.SPOTIFY,
            items: [],
            requester
        } as SearchResult;

        const track = new Track(
            AudioMediaSource.SPOTIFY,
            requester,
            parse(data.uri).toOpenURL(),
            data.title,
            data.artists.map((x: any) => {
                return {
                    name: x.name,
                    url: parse(x.uri).toOpenURL(),
                    imageURL: null
                }
            }),
            null,
            data.visualIdentity.image[0].url,
            data.duration
        );

        items.push(track);
    }
    else if (url.match(SPOTIFY_REGEX.PLAYLIST)) {
        const data = await spotify.getData(url);

        if (!data) return {
            type: SearchResultType.NOT_FOUND,
            source: AudioMediaSource.SPOTIFY,
            items: [],
            requester
        } as SearchResult;

        const tracks = [];

        for (let i = 0; i < data.trackList.length; i++) {
            const track = new Track(
                AudioMediaSource.SPOTIFY,
                requester,
                parse(data.trackList[i].uri).toOpenURL(),
                data.trackList[i].title,
                data.trackList[i].subtitle.split(", ").map((x: any) => {
                    return {
                        name: x,
                        url: null,
                        imageURL: null
                    }
                }),
                null,
                null,
                data.trackList[i].duration
            );

            tracks.push(track);
        }

        const playlist = new Playlist(
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

        items.push(playlist);
    }
    else if (url.match(SPOTIFY_REGEX.ALBUM)) {
        const data = await spotify.getData(url);

        if (!data) return {
            type: SearchResultType.NOT_FOUND,
            source: AudioMediaSource.SPOTIFY,
            items: [],
            requester
        } as SearchResult;

        const trackAlbum: TrackAlbum = {
            title: data.title,
            url: parse(data.uri).toOpenURL(),
            coverArtURL: data.visualIdentity.image[0].url
        }

        const tracks = [];

        for (let i = 0; i < data.trackList.length; i++) {
            const track = new Track(
                AudioMediaSource.SPOTIFY,
                requester,
                parse(data.trackList[i].uri).toOpenURL(),
                data.trackList[i].title,
                data.trackList[i].subtitle.split(", ").map((x: any) => {
                    return {
                        name: x,
                        url: null,
                        imageURL: null
                    }
                }),
                trackAlbum,
                null,
                data.trackList[i].duration
            );

            tracks.push(track);
        }

        const album = new Album(
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

        items.push(album);
    }
    else return {
        type: SearchResultType.NOT_FOUND,
        source: AudioMediaSource.SPOTIFY,
        items: [],
        requester
    } as SearchResult;

    return {
        type: SearchResultType.FOUND,
        source: AudioMediaSource.SPOTIFY,
        items: items,
        requester: requester
    } as SearchResult;
}