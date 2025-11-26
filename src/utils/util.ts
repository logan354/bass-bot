import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, ColorResolvable, Colors } from "discord.js";
import { AudioMediaSource, SOUNDCLOUD_ICON_URL, SPOTIFY_ICON_URL, YOUTUBE_ICON_URL, YOUTUBE_MUSIC_ICON_URL } from "./constants";
import Bot from "../structures/Bot";
import { emojis } from "../../config.json";
import { createQueueEmptyMessage } from "./common";

const numberFormat = /^\d+$/;
const timeFormat = /^(?:(?:(\d+):)?(\d{1,2}):)?(\d{1,2})(?:\.(\d{3}))?$/;
const timeUnits = {
    ms: 1,
    s: 1000,
    m: 60000,
    h: 3600000,
}

const formatInt = (int: number) => {
    if (int < 10) return `0${int}`;
    return `${int}`;
}

/**
 * Formats milliseconds to a formatted timestamp.
 * e.g 0:30, 1:30, 2:15, 5:20.
 * @param milliseconds 
 * @returns
 */
export function formatDurationTimestamp(milliseconds: number): string {
    if (!milliseconds || !parseInt(milliseconds.toString())) return "0:00";
    const seconds = Math.floor(milliseconds % 60000 / 1000);
    const minutes = Math.floor(milliseconds % 3600000 / 60000);
    const hours = Math.floor(milliseconds / 3600000);
    if (hours > 0) {
        return `${hours}:${formatInt(minutes)}:${formatInt(seconds)}`;
    }
    if (minutes > 0) {
        return `${minutes}:${formatInt(seconds)}`;
    }
    return `0:${formatInt(seconds)}`;
}

/**
 * Converts human friendly time to milliseconds. Supports the format
 * 00:00:00.000 for hours, minutes, seconds, and milliseconds respectively.
 * And 0ms, 0s, 0m, 0h, and together 1m1s.
 *
 * @param {number|string} time
 * @returns {number}
 */
// export function parseDuration(timestamp: string) {
//     if (typeof timestamp === "number") { return timestamp * 1000; }
//     if (numberFormat.test(timestamp)) { return +timestamp * 1000; }
//     const firstFormat = timeFormat.exec(timestamp);
//     if (firstFormat) {
//         return (+(firstFormat[1] || 0) * timeUnits.h) +
//             (+(firstFormat[2] || 0) * timeUnits.m) +
//             (+firstFormat[3] * timeUnits.s) +
//             +(firstFormat[4] || 0);
//     } else {
//         let total = 0;
//         const r = /(-?\d+)(ms|s|m|h)/g;
//         let rs;
//         while ((rs = r.exec(timestamp)) !== null) {
//             total += +rs[1] * timeUnits[rs[2]];
//         }
//         return total;
//     };
// }

export function convertTimestampToMilliseconds(timestamp: string): number | undefined {
    if (parseInt(timestamp)) return parseInt(timestamp);


    return 0;
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
        case AudioMediaSource.YOUTUBE:
            return Colors.Red;
        case AudioMediaSource.YOUTUBE_MUSIC:
            return Colors.Red;
        case AudioMediaSource.SPOTIFY:
            return Colors.Green;
        case AudioMediaSource.SOUNDCLOUD:
            return Colors.Orange;
        default:
            return Colors.Default;
    }
}

export function getAudioMediaSourceIconURL(source: AudioMediaSource): string | undefined {
    switch (source) {
        case AudioMediaSource.YOUTUBE:
            return YOUTUBE_ICON_URL;
        case AudioMediaSource.YOUTUBE_MUSIC:
            return YOUTUBE_MUSIC_ICON_URL;
        case AudioMediaSource.SPOTIFY:
            return SPOTIFY_ICON_URL;
        case AudioMediaSource.SOUNDCLOUD:
            return SOUNDCLOUD_ICON_URL;
        default:
            return undefined;
    }
}

export function formatTitleCase(str: string): string {
    return str.toLowerCase().split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}