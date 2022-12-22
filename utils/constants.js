const QueryTypes = {
    // Auto
    AUTO: "auto",

    // Track
    YOUTUBE_VIDEO: "youtube-video",
    SPOTIFY_SONG: "spotify-song",
    SOUNDCLOUD_SONG: "soundcloud-song",

    // Playlist
    YOUTUBE_PLAYLIST: "youtube-playlist",
    SPOTIFY_ALBUM: "spotify-album",
    SPOTIFY_PLAYLIST: "spotify-playlist",
    SOUNDCLOUD_PLAYLIST: "soundcloud-playlist",

    // Search
    YOUTUBE_SEARCH: "youtube-search",
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

module.exports = { QueryTypes, LoadType, State }