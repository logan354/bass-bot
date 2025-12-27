import { ColorResolvable, Colors } from "discord.js";

import { AudioMediaSource, DISCORD_EMOJI_BASE_URL } from "./constants";
import { emojis } from "../../config.json";

/**
 * Formats timestamp from milliseconds.
 * E.g. 0:30, 1:30, 2:15, 5:20.
 * @param milliseconds 
 * @returns
 */
export function formatTimestamp(milliseconds: number): string {
    const seconds = Math.floor(milliseconds % 60000 / 1000);
    const minutes = Math.floor(milliseconds % 3600000 / 60000);
    const hours = Math.floor(milliseconds / 3600000);

    const formatNumber = (number: number) => number.toString().padStart(2, "0");

    if (hours > 0) {
        return `${hours}:${formatNumber(minutes)}:${formatNumber(seconds)}`;
    }
    if (minutes > 0) {
        return `${minutes}:${formatNumber(seconds)}`;
    }
    return `0:${formatNumber(seconds)}`;
}

/**
 * Converts timestamp to milliseconds. Supports the format:
 * 00:00:00.000 for hours, minutes, seconds, and milliseconds respectively.
 * And 0ms, 0s, 0m, 0h, and together 1m1s.
 * @param timestamp
 * @returns
 */
export function convertTimestamp(timestamp: string): number {
    const numberFormat = /^\d+$/;
    const timeFormat = /^(?:(?:(\d+):)?(\d{1,2}):)?(\d{1,2})(?:\.(\d{3}))?$/;
    const timeUnits: Record<'ms' | 's' | 'm' | 'h', number> = {
        ms: 1,
        s: 1000,
        m: 60000,
        h: 3600000,
    };

    if (typeof timestamp === "number") {
        return timestamp * 1000;
    }

    if (numberFormat.test(timestamp)) {
        return +timestamp * 1000;
    }

    const firstFormat = timeFormat.exec(timestamp);
    if (firstFormat) {
        const hours = +(firstFormat[1] || 0);
        const minutes = +(firstFormat[2] || 0);
        const seconds = +firstFormat[3];
        const milliseconds = +(firstFormat[4] || 0);

        return hours * timeUnits.h + minutes * timeUnits.m + seconds * timeUnits.s + milliseconds;
    } else {
        let total = 0;
        const r = /(-?\d+)(ms|s|m|h)/g;
        let rs: RegExpExecArray | null;
        while ((rs = r.exec(timestamp)) !== null) {
            const value = +rs[1];
            const unit = rs[2] as keyof typeof timeUnits;
            total += value * timeUnits[unit];
        }
        return total;
    }
}

/**
 * Creates progress bar
 * @param currentDuration
 * @param totalDuration
 * @returns
 */
export function createProgressBar(currentDuration: number, totalDuration: number, disable: boolean): string {
    const length = 20;

    const index = Math.round((currentDuration / totalDuration) * length - 1);
    const indicator = "🔘";
    const line = "▬";

    if (index >= 1 && index <= length) {
        const bar = line.repeat(length - 1).split("");

        if (disable) return bar.join("");

        bar.splice(index, 0, indicator);
        return ` ┃ ${bar.join("")} ┃ `;
    } else {
        return ` ┃ ${indicator}${line.repeat(length - 1)} ┃ `;
    }
}

export function getAudioMediaSourceEmbedColor(source: AudioMediaSource): ColorResolvable {
    switch (source) {
        case AudioMediaSource.YOUTUBE: return Colors.Red;
        case AudioMediaSource.YOUTUBE_MUSIC: return Colors.Red;
        case AudioMediaSource.SPOTIFY: return Colors.Green;
        case AudioMediaSource.SOUNDCLOUD: return Colors.Orange;
        default: return Colors.Default;
    }
}

export function getAudioMediaSourceIconURL(source: AudioMediaSource): string | undefined {
    switch (source) {
        case AudioMediaSource.YOUTUBE: return `${DISCORD_EMOJI_BASE_URL}/${emojis.youtube.split(":")[2].replace(">", "")}`;
        case AudioMediaSource.YOUTUBE_MUSIC: return `${DISCORD_EMOJI_BASE_URL}/${emojis.youtube_music.split(":")[2].replace(">", "")}`;
        case AudioMediaSource.SPOTIFY: return `${DISCORD_EMOJI_BASE_URL}/${emojis.spotify.split(":")[2].replace(">", "")}`;
        case AudioMediaSource.SOUNDCLOUD: return `${DISCORD_EMOJI_BASE_URL}/${emojis.soundcloud.split(":")[2].replace(">", "")}`;
        default: return undefined;
    }
}