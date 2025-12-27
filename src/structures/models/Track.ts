import { User } from "discord.js";

import { QueueableAudioMedia } from "../AudioMedia";
import { AudioMediaSource, QueueableAudioMediaType } from "../../utils/constants";

export interface Artist {
    url?: string;
    name: string;
    imageURL?: string;
}

export interface Album {
    url?: string;
    title: string;
    coverArtURL?: string;
}

export default class Track extends QueueableAudioMedia {
    url: string;

    title: string;

    artists: Artist[];

    album: Album | null;

    imageURL: string | null;

    duration: number;

    constructor(
        source: AudioMediaSource,
        requester: User | null,
        url: string,
        title: string,
        artists: Artist[],
        album: Album | null,
        imageURL: string | null,
        duration: number,
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
    }
}