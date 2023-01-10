const { QueryType } = require("./constants");

const QueryTypeRegex = {
    YOUTUBE_VIDEO: /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi,
    YOUTUBE_PLAYLIST: /^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/,

    SPOTIFY_SONG: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:track\/|\?uri=spotify:track:)((\w|-){22})/,
    SPOTIFY_ALBUM: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:album\/|\?uri=spotify:album:)((\w|-){22})/,
    SPOTIFY_PLAYLIST: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:playlist\/|\?uri=spotify:playlist:)((\w|-){22})/,

    SOUNDCLOUD_SONG: /^https?:\/\/(soundcloud\.com)\/(.*)$/gi,
    SOUNDCLOUD_PLAYLIST: /^https?:\/\/(soundcloud\.com|snd\.sc)\/([A-Za-z0-9_-]+)\/sets\/([A-Za-z0-9_-]+)\/?$/
}

/**
 * Resolve the query's type
 * @param {string} query
 * @returns {QueryType}
 */
function resolveQueryType(query) {
    // Resolve playlists/albums before tracks
    if (query.match(QueryTypeRegex.YOUTUBE_PLAYLIST)) return QueryType.YOUTUBE_PLAYLIST;
    if (query.match(QueryTypeRegex.YOUTUBE_VIDEO)) return QueryType.YOUTUBE_VIDEO;

    if (query.match(QueryTypeRegex.SPOTIFY_SONG)) return QueryType.SPOTIFY_SONG;
    if (query.match(QueryTypeRegex.SPOTIFY_ALBUM)) return QueryType.SPOTIFY_ALBUM;
    if (query.match(QueryTypeRegex.SPOTIFY_PLAYLIST)) return QueryType.SPOTIFY_PLAYLIST;

    if (query.match(QueryTypeRegex.SOUNDCLOUD_PLAYLIST)) return QueryType.SOUNDCLOUD_PLAYLIST;
    if (query.match(QueryTypeRegex.SOUNDCLOUD_SONG)) return QueryType.SOUNDCLOUD_SONG;

    // Unresolved query will default to a search
    return QueryType.YOUTUBE_SEARCH;
}

module.exports = { resolveQueryType } 