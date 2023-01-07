const { User } = require("discord.js");
const { QueryType, LoadType, Source } = require("../utils/constants");
const { resolveQueryType } = require("../utils/queryResolver");
const { formatDuration } = require("../utils/formats");
const YouTube = require("youtube-sr").default;
const fetch = require("isomorphic-unfetch");
const spotify = require("spotify-url-info")(fetch);
const scdl = require("soundcloud-downloader").default;

/**
 * Search engine for Youtube, Spotify, and Soundcloud
 * @param {string} query 
 * @param {User} requester
 * @param {SearchEngineOptions} [options]
 * @returns {SearchResult}
 */
async function searchEngine(query, requester, options = defaultSearchEngineOptions) {
    if (options.queryType === QueryType.AUTO) {
        options.queryType = resolveQueryType(query);
    }

    try {
        switch (options.queryType) {
            case QueryType.YOUTUBE_VIDEO: {
                const data = await YouTube.getVideo(query);
                if (!data) return {
                    loadType: LoadType.NO_MATCHES,
                    exception: null,
                    tracks: [],
                    playlist: null
                }

                const track = {
                    title: data.title,
                    channel: data.channel.name,
                    url: data.url,
                    thumbnail: data.thumbnail.url,
                    duration: data.duration,
                    durationFormatted: data.durationFormatted,
                    isLive: data.live,
                    requestedBy: requester,
                    source: Source.YOUTUBE
                }

                if (track.isLive === true || track.duration === 0) {
                    track.duration = 0;
                    track.durationFormatted = "LIVE";
                    track.isLive = true;
                }

                return {
                    loadType: LoadType.TRACK_LOADED,
                    exception: null,
                    tracks: [track],
                    playlist: null
                }
            }

            case QueryType.YOUTUBE_PLAYLIST: {
                const data = await YouTube.getPlaylist(query);
                if (!data) return {
                    loadType: LoadType.NO_MATCHES,
                    exception: null,
                    tracks: [],
                    playlist: null
                }

                const playlist = {
                    title: data.title,
                    channel: data.channel.name,
                    url: data.url,
                    thumbnail: data.thumbnail,
                    tracks: [],
                    requestedBy: requester,
                    source: Source.YOUTUBE
                }

                const list = data.videos

                for (const item of list) {
                    const track = {
                        title: item.title,
                        channel: item.channel.name,
                        url: item.url,
                        thumbnail: item.thumbnail.url,
                        duration: item.duration,
                        durationFormatted: item.durationFormatted,
                        isLive: item.live,
                        requestedBy: requester,
                        source: Source.YOUTUBE
                    }

                    if (track.isLive === true || track.duration === 0) {
                        track.duration = 0;
                        track.durationFormatted = "LIVE";
                        track.isLive = true;
                    }

                    playlist.tracks.push(track);
                }

                return {
                    loadType: LoadType.PLAYLIST_LOADED,
                    exception: null,
                    tracks: playlist.tracks,
                    playlist: playlist
                }
            }

            case QueryType.YOUTUBE_SEARCH: {
                const data = await YouTube.search(query, { limit: options.searchLimit });
                if (!data) return {
                    loadType: LoadType.NO_MATCHES,
                    exception: null,
                    tracks: [],
                    playlist: null
                }

                const res = [];
                const list = data;

                for (const item of list) {
                    const track = {
                        title: item.title,
                        channel: item.channel.name,
                        url: item.url,
                        thumbnail: item.thumbnail.url,
                        duration: item.duration,
                        durationFormatted: item.durationFormatted,
                        isLive: item.live,
                        requestedBy: requester,
                        source: Source.YOUTUBE
                    }

                    if (track.isLive === true || track.duration === 0) {
                        track.duration = 0;
                        track.durationFormatted = "LIVE";
                        track.isLive = true;
                    }

                    res.push(track);
                }

                return SearchResult = {
                    loadType: LoadType.SEARCH_RESULT,
                    exception: null,
                    tracks: res,
                    playlist: null
                }
            }

            case QueryType.SPOTIFY_SONG: {
                const data = await spotify.getData(query);
                if (!data) return {
                    loadType: LoadType.NO_MATCHES,
                    exception: null,
                    tracks: [],
                    playlist: null
                }

                const track = {
                    title: data.name,
                    channel: data.artists[0].name,
                    url: data.uri.replace("spotify:track:", "https://open.spotify.com/track/"),
                    thumbnail: data.coverArt.sources[0].url,
                    duration: data.duration,
                    durationFormatted: formatDuration(data.duration),
                    isLive: false,
                    requestedBy: requester,
                    source: Source.SPOTIFY
                }

                return {
                    loadType: LoadType.TRACK_LOADED,
                    exception: null,
                    tracks: [track],
                    playlist: null
                }
            }

            case QueryType.SPOTIFY_ALBUM:
            case QueryType.SPOTIFY_PLAYLIST: {
                const data = await spotify.getData(query);
                if (!data) return {
                    loadType: LoadType.NO_MATCHES,
                    exception: null,
                    tracks: [],
                    playlist: null
                }

                const playlist = {
                    title: data.name,
                    channel: data.subtitle,
                    url: data.uri.replace("spotify:playlist:", "https://open.spotify.com/playlist/"),
                    thumbnail: data.coverArt.sources[0].url,
                    tracks: [],
                    requestedBy: requester,
                    source: Source.SPOTIFY
                }

                const list = data.trackList;

                for (const item of list) {
                    const track = {
                        title: item.title,
                        channel: item.subtitle,
                        url: item.uri.replace("spotify:track:", "https://open.spotify.com/track/"),
                        thumbnail: "https://www.scdn.co/i/_global/twitter_card-default.jpg",
                        duration: item.duration,
                        durationFormatted: formatDuration(item.duration),
                        isLive: false,
                        requestedBy: requester,
                        source: Source.SPOTIFY
                    }

                    playlist.tracks.push(track);
                }

                return {
                    loadType: LoadType.PLAYLIST_LOADED,
                    exception: null,
                    tracks: playlist.tracks,
                    playlist: playlist
                }
            }

            case QueryType.SOUNDCLOUD_SONG: {
                const data = await scdl.getInfo(query);
                if (!data) return {
                    loadType: LoadType.NO_MATCHES,
                    exception: null,
                    tracks: [],
                    playlist: null
                }

                const track = {
                    title: data.title,
                    channel: data.user.username,
                    url: data.permalink_url,
                    thumbnail: data.artwork_url,
                    duration: data.duration,
                    durationFormatted: formatDuration(data.duration),
                    isLive: false,
                    requestedBy: requester,
                    source: Source.SOUNDCLOUD
                }

                return {
                    loadType: LoadType.TRACK_LOADED,
                    exception: null,
                    tracks: [track],
                    playlist: null
                }
            }

            case QueryType.SOUNDCLOUD_PLAYLIST: {
                const data = await scdl.getSetInfo(query);
                if (!data) return {
                    loadType: LoadType.NO_MATCHES,
                    exception: null,
                    tracks: [],
                    playlist: null
                }

                const playlist = {
                    title: data.title,
                    channel: data.user.username,
                    url: data.permalink_url,
                    thumbnail: data.artwork_url,
                    tracks: [],
                    requestedBy: requester,
                    source: Source.SOUNDCLOUD
                }

                const list = data.tracks;

                for (const item of list) {
                    const track = {
                        title: item.title,
                        channel: item.user.username,
                        url: item.permalink_url,
                        thumbnail: item.artwork_url,
                        duration: item.duration,
                        durationFormatted: formatDuration(item.duration),
                        isLive: false,
                        requestedBy: requester,
                        source: Source.SOUNDCLOUD
                    }

                    playlist.tracks.push(track);
                }

                return {
                    loadType: LoadType.PLAYLIST_LOADED,
                    exception: null,
                    tracks: playlist.tracks,
                    playlist: playlist
                }
            }
        }
    } catch (error) {
        console.error(error);
        return {
            loadType: LoadType.LOAD_FAILED,
            exception: error,
            tracks: [],
            playlist: null
        }
    }
}

/**
 * The default search engine options
 * @type {SearchEngineOptions}
 */
const defaultSearchEngineOptions = {
    queryType: QueryType.AUTO,
    searchLimit: 1
}

/**
 * @typedef SearchEngineOptions
 * @property {QueryType} queryType
 * @property {number} searchLimit
 */

/**
 * @typedef Track
 * @property {string} title - The title of the track
 * @property {string} channel - The channel this track is from
 * @property {string} url - The url of the track
 * @property {string} thumbnail - The thumbnail of the track
 * @property {number} duration - The duration of the track
 * @property {string} durationFormatted - The formatted duration of the track
 * @property {boolean} isLive - If the track is live
 * @property {User} requestedBy - The user that requested this track
 * @property {Source} source - The source this track is from
 */

/**
 * @typedef Playlist
 * @property {string} title - The title of the playlist
 * @property {string} channel - The channel this playlist is from
 * @property {string} url - The url of the playlist
 * @property {string} thumbnail - The thumbnail of the playlist
 * @property {Track[]} tracks - The tracks of the playlist
 * @property {User} requestedBy - The user that requested this playlist
 * @property {Source} source - The source this playlist is from
*/

/**
 * @typedef SearchResult
 * @property {LoadType} loadType
 * @property {Track[]} tracks
 * @property {?Playlist} playlist
 * @property {?Error} exception
 */

module.exports = { searchEngine }