const ErrorStatusCodes = {
    NO_RESULTS: "NoResults",
    INVALID_LINK: "InvalidLink",
    UNKNOWN_ERROR: "UnknownError"
}

const QueryTypes = {
    //Playlists
    YOUTUBE_PLAYLIST: "youtube-playlist",
    SPOTIFY_ALBUM: "spotify-album",
    SPOTIFY_PLAYLIST: "spotify-playlist",
    SOUNDCLOUD_PLAYLIST: "soundcloud-playlist",
    //Videos
    YOUTUBE_VIDEO: "youtube-video",
    SPOTIFY_SONG: "spotify-song",
    SOUNDCLOUD_SONG: "soundcloud-song",
    //Search
    YOUTUBE_SEARCH: "youtube-video-keywords",
    //Custom
    CUSTOM: "custom"
}

const QueryTypesRegex = {
    //Playlists
    YOUTUBE_PLAYLIST: /^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/,
    SPOTIFY_ALBUM: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:album\/|\?uri=spotify:album:)((\w|-){22})/,
    SPOTIFY_PLAYLIST: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:playlist\/|\?uri=spotify:playlist:)((\w|-){22})/,
    SOUNDCLOUD_PLAYLIST: /^https?:\/\/(soundcloud\.com|snd\.sc)\/([A-Za-z0-9_-]+)\/sets\/([A-Za-z0-9_-]+)\/?$/,
    //Videos
    YOUTUBE_VIDEO: /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi,
    SPOTIFY_SONG: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:track\/|\?uri=spotify:track:)((\w|-){22})/,
    SOUNDCLOUD_SONG: /^https?:\/\/(soundcloud\.com)\/(.*)$/gi
}

module.exports = { ErrorStatusCodes, QueryTypes, QueryTypesRegex }