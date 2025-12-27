import { User } from "discord.js";

import Track from "./Track";
import { UnQueueableAudioMedia } from "../AudioMedia";
import { AudioMediaSource, UnQueueableAudioMediaType } from "../../utils/constants";

export interface Owner {
    url?: string;
    name: string;
    imageURL?: string;
}

export default class Playlist extends UnQueueableAudioMedia {
    url: string;

    title: string;

    owner: Owner;

    imageURL: string | null;

    tracks: Track[];

    constructor(
        source: AudioMediaSource,
        requester: User | null,
        url: string,
        title: string,
        owner: Owner,
        imageURL: string | null,
        tracks: Track[]
    ) {
        super(
            UnQueueableAudioMediaType.PLAYLIST,
            source,
            requester
        );

        this.url = url;
        this.title = title;
        this.owner = owner;
        this.imageURL = imageURL;
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