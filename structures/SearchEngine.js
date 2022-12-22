const { User } = require("discord.js");
const { QueryTypes, LoadType } = require("../utils/constants");
const { resolveQueryType } = require("../utils/queryResolver");
const { formatDuration } = require("../utils/formats");
const YouTube = require("youtube-sr").default;
const fetch = require("isomorphic-unfetch");
const spotify = require("spotify-url-info")(fetch);
const scdl = require("soundcloud-downloader").default;

/**
 * Search engine for Youtube, Spotify or Soundcloud
 * @param {string} query 
 * @param {User} requester
 * @param {SearchEngineOptions} [options]
 * @returns {SearchResult}
 */
async function searchEngine(query, requester, options = defaultSearchEngineOptions) {
    if (options.queryType === QueryTypes.AUTO) {
        options.queryType = resolveQueryType(query);
    }

    try {
        switch (options.queryType) {
            case QueryTypes.YOUTUBE_VIDEO: {
                const data = await YouTube.getVideo(query);
                if (!data) return {
                    loadType: LoadType.NO_MATCHES,
                    exception: null,
                    tracks: [],
                    playlist: null
                }

                const track = {
                    title: data.title,
                    url: data.url,
                    streamURL: data.url,
                    thumbnail: data.thumbnail.url,
                    duration: parseInt(data.duration),
                    durationFormatted: data.durationFormatted,
                    channel: data.channel.name,
                    requestedBy: requester,
                    isLive: data.live,
                    source: "youtube"
                }

                if (track.isLive === true || track.duration === 0) {
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

            case QueryTypes.YOUTUBE_PLAYLIST: {
                const data = await YouTube.getPlaylist(query);
                if (!data) return {
                    loadType: LoadType.NO_MATCHES,
                    exception: null,
                    tracks: [],
                    playlist: null
                }

                const playlist = {
                    title: data.title,
                    url: data.url,
                    thumbnail: data.thumbnail,
                    tracks: [],
                    duration: null,
                    durationFormatted: null,
                    channel: data.channel.name,
                    requestedBy: requester,
                    source: "youtube"
                }

                const list = data.videos

                for (const item of list) {
                    const track = {
                        title: item.title,
                        url: item.url,
                        streamURL: item.url,
                        thumbnail: item.thumbnail.url,
                        duration: parseInt(item.duration),
                        durationFormatted: item.durationFormatted,
                        channel: item.channel.name,
                        requestedBy: requester,
                        isLive: item.live,
                        source: "youtube"
                    }

                    if (track.isLive === true || track.duration === 0) {
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

            case QueryTypes.SPOTIFY_SONG: {
                const data = await spotify.getData(query);
                if (!data) return {
                    loadType: LoadType.NO_MATCHES,
                    exception: null,
                    tracks: [],
                    playlist: null
                }

                const track = {
                    title: data.name,
                    url: data.external_urls.spotify,
                    streamURL: data.external_urls.spotify,
                    thumbnail: data.coverArt.sources[0].url,
                    duration: data.duration,
                    durationFormatted: formatDuration(data.duration),
                    channel: data.artists[0].name,
                    requestedBy: requester,
                    isLive: false,
                    source: "spotify"
                }

                return {
                    loadType: LoadType.TRACK_LOADED,
                    exception: null,
                    tracks: [track],
                    playlist: null
                }
            }

            case QueryTypes.SPOTIFY_ALBUM:
            case QueryTypes.SPOTIFY_PLAYLIST: {
                const data = await spotify.getData(query);
                if (!data) return {
                    loadType: LoadType.NO_MATCHES,
                    exception: null,
                    tracks: [],
                    playlist: null
                }

                const playlist = {
                    title: data.name,
                    url: data.uri.replace("spotify:playlist:", "https://open.spotify.com/playlist/"),
                    thumbnail: data.coverArt.sources[0].url,
                    tracks: [],
                    duration: null,
                    durationFormatted: null,
                    channel: data.subtitle,
                    requestedBy: requester,
                    source: "spotify"
                }

                const list = data.trackList;

                for (const item of list) {
                    const track = {
                        title: item.title,
                        url: item.uri.replace("spotify:track:", "https://open.spotify.com/track/"),
                        streamURL: item.uri.replace("spotify:track:", "https://open.spotify.com/track/"),
                        thumbnail: "https://www.scdn.co/i/_global/twitter_card-default.jpg",
                        duration: item.duration,
                        durationFormatted: formatDuration(item.duration),
                        channel: item.subtitle,
                        requestedBy: requester,
                        isLive: false,
                        source: "spotify"
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

            case QueryTypes.SOUNDCLOUD_SONG: {
                const data = await scdl.getInfo(query);
                if (!data) return {
                    loadType: LoadType.NO_MATCHES,
                    exception: null,
                    tracks: [],
                    playlist: null
                }

                const track = {
                    title: data.title,
                    url: data.permalink_url,
                    streamURL: data.permalink_url,
                    thumbnail: data.artwork_url,
                    duration: parseInt(data.duration),
                    durationFormatted: formatDuration(data.duration),
                    channel: data.user.username,
                    requestedBy: requester,
                    isLive: false,
                    source: "soundcloud"
                }

                return {
                    loadType: LoadType.TRACK_LOADED,
                    exception: null,
                    tracks: [track],
                    playlist: null
                }
            }

            case QueryTypes.SOUNDCLOUD_PLAYLIST: {
                const data = await scdl.getSetInfo(query);
                if (!data) return {
                    loadType: LoadType.NO_MATCHES,
                    exception: null,
                    tracks: [],
                    playlist: null
                }

                const playlist = {
                    title: data.title,
                    url: data.permalink_url,
                    thumbnail: data.artwork_url,
                    tracks: [],
                    duration: null,
                    durationFormatted: null,
                    channel: data.user.username,
                    requestedBy: requester,
                    source: "soundcloud"
                }

                const list = data.tracks;

                for (const item of list) {
                    const track = {
                        title: item.title,
                        url: item.permalink_url,
                        streamURL: item.permalink_url,
                        thumbnail: item.artwork_url,
                        duration: parseInt(item.duration),
                        durationFormatted: formatDuration(item.duration),
                        channel: item.user.username,
                        requestedBy: requester,
                        isLive: false,
                        source: "soundcloud"
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

            case "youtube-search": {
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
                        url: item.url,
                        streamURL: item.url,
                        thumbnail: item.thumbnail.url,
                        duration: parseInt(item.duration),
                        durationFormatted: item.durationFormatted,
                        channel: item.channel.name,
                        requestedBy: requester,
                        isLive: item.live,
                        source: "youtube"
                    }

                    if (track.isLive === true || track.duration === 0) {
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
        }
    } catch (e) {
        console.error(e);
        return {
            loadType: LoadType.LOAD_FAILED,
            exception: e,
            tracks: [],
            playlist: null
        }
    }
}


/**
 * Default options for the Search Engine
 * @type {SearchEngineOptions}
 */
const defaultSearchEngineOptions = {
    queryType: QueryTypes.AUTO,
    searchLimit: 1
}

/**
 * @typedef SearchEngineOptions
 * @property {QueryTypes} queryType
 * @property {number} searchLimit
 */

/**
 * @typedef Track
 * @property {string} title - The title of the track
 * @property {string} url - The url of the track
 * @property {string} streamURL - The stream url of the track
 * @property {string} thumbnail - The thumbnail of the track
 * @property {string|number} duration - The duration of the track
 * @property {string} durationFormatted - The formatted duration of the track
 * @property {string} channel - The channel this track is from
 * @property {User} requestedBy - The user that requested this track
 * @property {boolean} isLive - If the track is live
 * @property {string} source - The source this track is from
 */

/**
 * @typedef Playlist
 * @property {string} title - The title of the playlist
 * @property {string} url - The url of the playlist
 * @property {string} thumbnail - The thumbnail of the playlist
 * @property {?string|?number} duration - The duration of the playlist
 * @property {?string} durationFormatted - The formatted duration of the playlist
 * @property {string} channel - The channel this playlist is from
 * @property {User} requestedBy - The user that requested this playlist
 * @property {string} source - The source this playlist is from
*/

/**
 * @typedef SearchResult
 * @property {LoadType} loadType
 * @property {Track[]} tracks
 * @property {?Playlist} playlist
 * @property {?Error} exception
 */

module.exports = { searchEngine }