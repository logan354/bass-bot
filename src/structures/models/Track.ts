import { User } from "discord.js";

import { QueueableAudioMedia } from "../AudioMedia";
import { AudioMediaSource, QueueableAudioMediaType } from "../../utils/constants";

export interface TrackArtist {
    name: string;
    url?: string;
    imageURL?: string;
}

export interface TrackAlbum {
    title: string;
    url?: string;
    coverArtURL?: string;
}

export default class Track extends QueueableAudioMedia {
    url: string;

    title: string;

    artists: TrackArtist[];

    album: TrackAlbum | null;

    imageURL: string | null;

    duration: number;

    isLiveStream: boolean

    constructor(
        source: AudioMediaSource,
        requester: User | null,
        url: string,
        title: string,
        artists: TrackArtist[],
        album: TrackAlbum | null,
        imageURL: string | null,
        duration: number,
        isLiveStream: boolean
    ) {
        super(
            QueueableAudioMediaType.TRACK,
            source,
            requester
        );

        this.url = url;
        this.title = title;
        this.artists = artists;
        this.album = album;
        this.imageURL = imageURL;
        this.duration = duration;
        this.isLiveStream = isLiveStream;
    }
}