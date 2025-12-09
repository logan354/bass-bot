import { User } from "discord.js";

import Track from "./Track";
import { UnQueueableAudioMedia } from "../AudioMedia";
import { AudioMediaSource, UnQueueableAudioMediaType } from "../../utils/constants";

export interface Artist {
    name: string;
    url?: string;
    imageURL?: string;
}

export default class Album extends UnQueueableAudioMedia {
    url: string;

    title: string;

    artists: Artist[];

    coverArtURL: string;

    tracks: Array<Track>;

    constructor(
        source: AudioMediaSource,
        requester: User | null,
        url: string,
        title: string,
        artists: Artist[],
        coverArtURL: string,
        tracks: Array<Track>
    ) {
        super(
            UnQueueableAudioMediaType.ALBUM,
            source,
            requester
        );

        this.url = url;
        this.title = title;
        this.artists = artists;
        this.coverArtURL = coverArtURL;
        this.tracks = tracks;
    }

    get getDuration() {
        let duration = 0;

        for (let i = 0; i < this.tracks.length; i++) {
            duration += this.tracks[i].duration
        }

        return duration;
    }
}