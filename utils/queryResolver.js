const { QueryTypes } = require("./constants");

const QueryTypesRegex = {
    // Playlists
    YOUTUBE_PLAYLIST: /^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/,
    SPOTIFY_ALBUM: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:album\/|\?uri=spotify:album:)((\w|-){22})/,
    SPOTIFY_PLAYLIST: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:playlist\/|\?uri=spotify:playlist:)((\w|-){22})/,
    SOUNDCLOUD_PLAYLIST: /^https?:\/\/(soundcloud\.com|snd\.sc)\/([A-Za-z0-9_-]+)\/sets\/([A-Za-z0-9_-]+)\/?$/,
    // Videos
    YOUTUBE_VIDEO: /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi,
    SPOTIFY_SONG: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:track\/|\?uri=spotify:track:)((\w|-){22})/,
    SOUNDCLOUD_SONG: /^https?:\/\/(soundcloud\.com)\/(.*)$/gi
}

/**
 * Resolves query type
 * @param {string} query
 * @returns {QueryTypes}
 */
function resolveQueryType(query) {
    // Check if the query matches a playlist regex
    if (query.match(QueryTypesRegex.YOUTUBE_PLAYLIST)) return QueryTypes.YOUTUBE_PLAYLIST;
    if (query.match(QueryTypesRegex.SPOTIFY_ALBUM)) return QueryTypes.SPOTIFY_ALBUM;
    if (query.match(QueryTypesRegex.SPOTIFY_PLAYLIST)) return QueryTypes.SPOTIFY_PLAYLIST;
    if (query.match(QueryTypesRegex.SOUNDCLOUD_PLAYLIST)) return QueryTypes.SOUNDCLOUD_PLAYLIST;
    // Check if the query matches a video regex
    if (query.match(QueryTypesRegex.YOUTUBE_VIDEO)) return QueryTypes.YOUTUBE_VIDEO;
    if (query.match(QueryTypesRegex.SPOTIFY_SONG)) return QueryTypes.SPOTIFY_SONG;
    if (query.match(QueryTypesRegex.SOUNDCLOUD_SONG)) return QueryTypes.SOUNDCLOUD_SONG;
    // If playlist and video regex checks are false default to search
    return QueryTypes.YOUTUBE_VIDEO_SEARCH;
}

module.exports = { resolveQueryType } 