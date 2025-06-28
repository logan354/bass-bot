import { ColorResolvable, Colors } from "discord.js";
import { AudioMediaSource, SOUNDCLOUD_ICON_URL, SPOTIFY_ICON_URL, YOUTUBE_ICON_URL, YOUTUBE_MUSIC_ICON_URL } from "./constants";
import Bot from "../structures/Bot";

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
 * Creates progress bar
 * @param currentDuration
 * @param totalDuration
 * @returns
 */
export function createProgressBar(currentDuration: number, totalDuration: number, disable: boolean): string {
    const length = 15;

    const index = Math.round((currentDuration / totalDuration) * length);
    const indicator = "🔘";
    const line = "▬";

    if (index >= 1 && index <= length) {
        const bar = line.repeat(length - 1).split("");

        if (disable) return bar.join("");

        bar.splice(index, 0, indicator);
        return formatDurationTimestamp(currentDuration) + ` ┃ ${bar.join("")} ┃ ` + formatDurationTimestamp(totalDuration);
    } else {
        return formatDurationTimestamp(currentDuration) + ` ┃ ${indicator}${line.repeat(length - 1)} ┃ ` + formatDurationTimestamp(totalDuration);
    }
}

export function getAudioMediaSourceEmbedColor(source: AudioMediaSource) : ColorResolvable {
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

export function getAudioMediaSourceIconURL(source: AudioMediaSource) : string | undefined {
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

export async function getApplicationCommandId(bot: Bot, commandName: string): Promise<string | undefined> {
    const commands = await bot.application.commands.fetch();
    return commands.find((x) => x.name === commandName)?.id;
}

export function formatTitleCase(str: string): string {
    return str.toLowerCase().split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}