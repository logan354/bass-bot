const { QueryType } = require("./constants");

const QueryTypesRegex = {
    // Tracks
    YOUTUBE_VIDEO: /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi,
    SPOTIFY_SONG: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:track\/|\?uri=spotify:track:)((\w|-){22})/,
    SOUNDCLOUD_SONG: /^https?:\/\/(soundcloud\.com)\/(.*)$/gi,

    // Playlists
    YOUTUBE_PLAYLIST: /^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/,
    SPOTIFY_ALBUM: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:album\/|\?uri=spotify:album:)((\w|-){22})/,
    SPOTIFY_PLAYLIST: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:playlist\/|\?uri=spotify:playlist:)((\w|-){22})/,
    SOUNDCLOUD_PLAYLIST: /^https?:\/\/(soundcloud\.com|snd\.sc)\/([A-Za-z0-9_-]+)\/sets\/([A-Za-z0-9_-]+)\/?$/
}

/**
 * Resolves query type
 * @param {string} query
 * @returns {QueryTypes}
 */
function resolveQueryType(query) {
    // Check if the query matches a playlist regex
    if (query.match(QueryTypesRegex.YOUTUBE_PLAYLIST)) return QueryType.YOUTUBE_PLAYLIST;
    if (query.match(QueryTypesRegex.SPOTIFY_ALBUM)) return QueryType.SPOTIFY_ALBUM;
    if (query.match(QueryTypesRegex.SPOTIFY_PLAYLIST)) return QueryType.SPOTIFY_PLAYLIST;
    if (query.match(QueryTypesRegex.SOUNDCLOUD_PLAYLIST)) return QueryType.SOUNDCLOUD_PLAYLIST;
    // Check if the query matches a track regex
    if (query.match(QueryTypesRegex.YOUTUBE_VIDEO)) return QueryType.YOUTUBE_VIDEO;
    if (query.match(QueryTypesRegex.SPOTIFY_SONG)) return QueryType.SPOTIFY_SONG;
    if (query.match(QueryTypesRegex.SOUNDCLOUD_SONG)) return QueryType.SOUNDCLOUD_SONG;
    // If playlist and track regex checks are false default to search
    return QueryType.YOUTUBE_SEARCH;
}

module.exports = { resolveQueryType } 