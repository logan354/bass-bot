import { User } from "discord.js";

import { AudioMediaSource, AudioMediaType, QueueableAudioMediaType, UnQueueableAudioMediaType } from "../utils/constants";

export abstract class AudioMedia {
    type: AudioMediaType;

    source: AudioMediaSource;

    isQueueable: boolean;

    requester: User | null = null;


    constructor(type: AudioMediaType, source: AudioMediaSource, isQueueable: boolean, requester: User | null) {
        this.type = type;
        this.source = source;
        this.isQueueable = isQueueable;
        this.requester = requester;
    }
}

export abstract class QueueableAudioMedia extends AudioMedia {
    override type: QueueableAudioMediaType;

    constructor(type: QueueableAudioMediaType, source: AudioMediaSource, requester: User | null) {
        super(
            type,
            source,
            true,
            requester
        )

        this.type = type;
    }
}

export abstract class UnQueueableAudioMedia extends AudioMedia {
    override type: UnQueueableAudioMediaType;

    constructor(type: UnQueueableAudioMediaType, source: AudioMediaSource, requester: User | null) {
        super(
            type,
            source,
            false,
            requester
        )

        this.type = type;
    }
}