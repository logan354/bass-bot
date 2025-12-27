import { User } from "discord.js";

import { QueueableAudioMedia } from "../AudioMedia";
import { AudioMediaSource, QueueableAudioMediaType } from "../../utils/constants";

export interface Artist {
    url?: string;
    name: string;
    imageURL?: string;
}

export default class LiveStream extends QueueableAudioMedia {
    url: string;

    title: string;

    artists: Artist[];

    imageURL: string | null;

    constructor(
        source: AudioMediaSource,
        requester: User | null,
        url: string,
        title: string,
        artists: Artist[],
        imageURL: string | null,
    ) {
        super(
            QueueableAudioMediaType.LIVE_STREAM,
            source,
            requester
        );

        this.url = url;
        this.title = title;
        this.artists = artists;
        this.imageURL = imageURL;
    }
}