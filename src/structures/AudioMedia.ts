import { User } from "discord.js";

import { AudioMediaSource, AudioMediaType, QueueableAudioMediaType, UnQueueableAudioMediaType } from "../utils/constants";

export abstract class AudioMedia {
    type: AudioMediaType;

    source: AudioMediaSource;

    requester: User | null = null;

    isQueueable: boolean;

    constructor(type: AudioMediaType, source: AudioMediaSource, requester: User | null, isQueueable: boolean, ) {
        this.type = type;
        this.source = source;
        this.requester = requester;
        this.isQueueable = isQueueable;
    }
}

export abstract class QueueableAudioMedia extends AudioMedia {
    override type: QueueableAudioMediaType;

    streamURL: string | null;

    constructor(type: QueueableAudioMediaType, source: AudioMediaSource, requester: User | null) {
        super(
            type,
            source,
            requester,
            true
        )

        this.type = type;
        this.streamURL = null;
    }
}

export abstract class UnQueueableAudioMedia extends AudioMedia {
    override type: UnQueueableAudioMediaType;

    constructor(type: UnQueueableAudioMediaType, source: AudioMediaSource, requester: User | null) {
        super(
            type,
            source,
            requester,
            false
        )

        this.type = type;
    }
}