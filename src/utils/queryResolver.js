const { QueryTypes, QueryTypesRegex } = require("../types/types");

/**
 * Resolves query type
 * @param {string} query User query
 * @returns {string}
 */
 function resolveQueryType(query) {
     //Playlists
     if (query.match(QueryTypesRegex.YOUTUBE_PLAYLIST)) return QueryTypes.YOUTUBE_PLAYLIST;
     if (query.match(QueryTypesRegex.SPOTIFY_ALBUM)) return QueryTypes.SPOTIFY_ALBUM;
     if (query.match(QueryTypesRegex.SPOTIFY_PLAYLIST)) return QueryTypes.SPOTIFY_PLAYLIST;
     if (query.match(QueryTypesRegex.SOUNDCLOUD_PLAYLIST)) return QueryTypes.SOUNDCLOUD_PLAYLIST;
     //Videos
     if (query.match(QueryTypesRegex.YOUTUBE_VIDEO)) return QueryTypes.YOUTUBE_VIDEO;
     if (query.match(QueryTypesRegex.SPOTIFY_SONG)) return QueryTypes.SPOTIFY_SONG;
     if (query.match(QueryTypesRegex.SOUNDCLOUD_SONG)) return QueryTypes.SOUNDCLOUD_SONG;
     //Search
     return QueryTypes.YOUTUBE_SEARCH;
}

module.exports = { resolveQueryType }