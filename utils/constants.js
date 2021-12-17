const QueryTypes = {
    // Playlists
    YOUTUBE_PLAYLIST: "youtube-playlist",
    SPOTIFY_ALBUM: "spotify-album",
    SPOTIFY_PLAYLIST: "spotify-playlist",
    SOUNDCLOUD_PLAYLIST: "soundcloud-playlist",
    // Videos
    YOUTUBE_VIDEO: "youtube-video",
    SPOTIFY_SONG: "spotify-song",
    SOUNDCLOUD_SONG: "soundcloud-song",
    // General Search
    YOUTUBE_VIDEO_SEARCH: "youtube-video-search",
    // Custom searches
    YOUTUBE_SEARCH: "youtube-search",
    SOUNDCLOUD_SEARCH: "soundcloud-search"
}

const LoadType = {
    TRACK_LOADED: "TRACK_LOADED",
    PLAYLIST_LOADED: "PLAYLIST_LOADED",
    SEARCH_RESULT: "SEARCH_RESULT",
    LOAD_FAILED: "LOAD_FAILED",
    NO_MATCHES: "NO_MATCHES"
}

const State = {
    CONNECTED: "CONNECTED",
    CONNECTING: "CONNECTING",
    DISCONNECTED: "DISCONNECTED",
    DISCONNECTING: "DISCONNECTING",
    DESTROYING: "DESTROYING"
}

const ErrorCode = {
    CORRUPTED_STREAM: "CORRUPTED_STREAM",
    CORRUPTED_CONNECTION: "CORRUPTED_CONNECTION",
    CORRUPTED_PLAYER: "CORRUPTED_PLAYER",
    INVALID_CHANNEL: "INVALID_CHANNEL",
    LIVE_TRACK: "LIVE_TRACK"
}

module.exports = { QueryTypes, LoadType, State, ErrorCode }