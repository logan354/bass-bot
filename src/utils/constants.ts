export const AudioMediaType = {
    ALBUM: "ALBUM",
    LIVE_STREAM: "LIVE_STREAM",
    PLAYLIST: "PLAYLIST",
    TRACK: "TRACK",
} as const;

export type AudioMediaType = keyof typeof AudioMediaType;

export const QueueableAudioMediaType = {
    LIVE_STREAM: "LIVE_STREAM",
    TRACK: "TRACK"
} as const;

export type QueueableAudioMediaType = keyof typeof QueueableAudioMediaType;

export const UnQueueableAudioMediaType = {
    PLAYLIST: "PLAYLIST",
    ALBUM: "ALBUM",
} as const;

export type UnQueueableAudioMediaType = keyof typeof UnQueueableAudioMediaType;

export const AudioMediaSource = {
    SOUNDCLOUD: "SOUNDCLOUD",
    SPOTIFY: "SPOTIFY",
    YOUTUBE: "YOUTUBE",
    YOUTUBE_MUSIC: "YOUTUBE_MUSIC",
} as const;

export type AudioMediaSource = keyof typeof AudioMediaSource;

export const SearchResultType = {
    ERROR: "ERROR",
    FOUND: "FOUND",
    NOT_FOUND: "NOT_FOUND",
    NO_RESULTS: "NO_RESULTS",
    RESULTS: "RESULTS"
} as const;

export type SearchResultType = keyof typeof SearchResultType;

export const RepeatMode = {
    OFF: "OFF",
    ONE: "ONE",
    ALL: "ALL"
} as const;

export type RepeatMode = keyof typeof RepeatMode;

export const BASE_YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/;
export const YOUTUBE_REGEX = {
    PLAYLIST: /^https?:\/\/(www.)?youtube.com\/playlist\?list=((PL|FL|UU|LL|RD|OL)[a-zA-Z0-9-_]{16,41})$/,
    VIDEO: /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/
} as const;

export const BASE_YOUTUBE_MUSIC_REGEX = /^https?:\/\/(www\.)?music\.youtube\.com\/?.*$/;
export const YOUTUBE_MUSIC_REGEX = {
    PLAYLIST: /^https?:\/\/(www\.)?music\.youtube\.com\/playlist\?list=[\w-]+$/,
    SONG: /^https?:\/\/(www\.)?music\.youtube\.com\/watch\?v=[\w-]{11}$/
} as const;

export const BASE_SPOTIFY_REGEX = /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/).+$/;
export const SPOTIFY_REGEX = {
    TRACK: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:track\/|\?uri=spotify:track:)((\w|-){22})/,
    ALBUM: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:album\/|\?uri=spotify:album:)((\w|-){22})/,
    PLAYLIST: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:playlist\/|\?uri=spotify:playlist:)((\w|-){22})/
} as const;

export const BASE_SOUNDCLOUD_REGEX = /^https?:\/\/(soundcloud\.com|snd\.sc)\/(.*)$/;
export const SOUNDCLOUD_REGEX = {
    TRACK: /^https?:\/\/(soundcloud\.com)\/(.*)$/gi,
    ALBUM: /^/,
    PLAYLIST: /^https?:\/\/(soundcloud\.com|snd\.sc)\/([A-Za-z0-9_-]+)\/sets\/([A-Za-z0-9_-]+)\/?$/
}

export const DISCORD_EMOJI_BASE_URL = "https://cdn.discordapp.com/emojis";