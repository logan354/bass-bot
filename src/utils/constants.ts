import YouTube from "youtube-sr";

export const AudioMediaType = {
    ALBUM: "ALBUM",
    LIVE_STREAM: "LIVE_STREAM",
    PLAYLIST: "PLAYLIST",
    TRACK: "TRACK",
} as const;

export type AudioMediaType = keyof typeof AudioMediaType;

export const SearchAudioMediaType = {
    ALBUM: "ALBUM",
    ALL: "ALL",
    PLAYLIST: "PLAYLIST",
    TRACK: "TRACK",
} as const;

export type SearchAudioMediaType = keyof typeof SearchAudioMediaType;

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
    YOUTUBE: "YOUTUBE",
    YOUTUBE_MUSIC: "YOUTUBE_MUSIC",
    SPOTIFY: "SPOTIFY",
    SOUNDCLOUD: "SOUNDCLOUD",
    GENERIC: "GENERIC"
} as const;

export type AudioMediaSource = keyof typeof AudioMediaSource;

export const RepeatMode = {
    OFF: "OFF",
    ONE: "ONE",
    ALL: "ALL"
} as const;

export type RepeatMode = keyof typeof RepeatMode;

export const SearchResultType = {
    FOUND: "FOUND",
    RESULTS: "RESULTS",
    NOT_FOUND: "NOT_FOUND",
    NO_RESULTS: "NO_RESULTS"
} as const;

export type SearchResultType = keyof typeof SearchResultType;

export const BASE_YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/;
export const YOUTUBE_REGEX = {
    VIDEO: YouTube.Regex.VIDEO_URL,
    PLAYLIST: YouTube.Regex.PLAYLIST_URL
} as const;

export const BASE_YOUTUBE_MUSIC_REGEX = /^https?:\/\/(www\.)?music\.youtube\.com\/?.*$/;
export const YOUTUBE_MUSIC_REGEX = {
    SONG: /^https?:\/\/(www\.)?music\.youtube\.com\/watch\?v=[\w-]{11}$/,
    ALBUM: /^https?:\/\/(www\.)?music\.youtube\.com\/browse\/[A-Z0-9_-]+$/,
    PLAYLIST: /^https?:\/\/(www\.)?music\.youtube\.com\/playlist\?list=[\w-]+$/
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

export const YOUTUBE_URL = "https://www.youtube.com";
export const YOUTUBE_ICON_URL = "https://www.youtube.com/s/desktop/75053a37/img/favicon_32x32.png";

export const YOUTUBE_MUSIC_URL = "https://music.youtube.com";
export const YOUTUBE_MUSIC_ICON_URL = "https://music.youtube.com/img/cairo/favicon_32S.png";

export const SPOTIFY_URL = "https://open.spotify.com";
export const SPOTIFY_ICON_URL = "https://open.spotifycdn.com/cdn/images/favicon32.b64ecc03.png";

export const SOUNDCLOUD_URL = "";
export const SOUNDCLOUD_ICON_URL = "";

export const DEFAULT_SEARCH_COUNT = 5;

export const DEFAULT_SEARCH_RESULT_TIMEOUT = 60000;