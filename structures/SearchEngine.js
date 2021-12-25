const { User } = require("discord.js");

const YouTube = require("youtube-sr").default;
const spotify = require("spotify-url-info");
const scdl = require("soundcloud-downloader").default;

const { LoadType } = require("../utils/constants");
const { resolveQueryType } = require("../utils/queryResolver")

/**
 * Searches for the query on Youtube, Spotify or Soundcloud
 * @param {string} query 
 * @param {SearchEngineOptions} [options]
 * @returns {SearchResult}
 */
async function searchEngine(query, options = defaultSearchEngineoptions) {
    if (options.queryType === "auto") options.queryType = resolveQueryType(query);
    try {
        switch (options.queryType) {
            case "youtube-video": {
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
                    requestedBy: options.requester,
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

            case "youtube-playlist": {
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
                    requestedBy: options.requester,
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
                        requestedBy: options.requester,
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

            case "spotify-song": {
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
                    thumbnail: data.album.images[0].url,
                    duration: parseInt(data.duration_ms),
                    durationFormatted: Util.formatDuration(data.duration_ms),
                    channel: data.artists[0].name,
                    requestedBy: options.requester,
                    isLive: false,
                    source: "spotify"
                }

                track.title = track.channel + " - " + track.title;

                return {
                    loadType: LoadType.TRACK_LOADED,
                    exception: null,
                    tracks: [track],
                    playlist: null
                }
            }

            case "spotify-album":
            case "spotify-playlist": {
                const data = await spotify.getData(query);
                if (!data) return {
                    loadType: LoadType.NO_MATCHES,
                    exception: null,
                    tracks: [],
                    playlist: null
                }

                const playlist = {
                    title: data.name,
                    url: data.external_urls.spotify,
                    thumbnail: data.images[0].url,
                    tracks: [],
                    duration: null,
                    durationFormatted: null,
                    channel: data.owner.display_name,
                    requestedBy: options.requester,
                    source: "spotify"
                }

                const list = data.tracks.items;

                for (const item of list) {
                    const track = {
                        title: item.track.name,
                        url: item.track.external_urls.spotify,
                        streamURL: item.track.external_urls.spotify,
                        thumbnail: item.track.album.images[0].url,
                        duration: parseInt(item.track.duration_ms),
                        durationFormatted: Util.formatDuration(item.track.duration_ms),
                        channel: item.track.artists[0].name,
                        requestedBy: options.requester,
                        isLive: false,
                        source: "spotify"
                    }

                    track.title = track.channel + " - " + track.title;
                    playlist.tracks.push(track);
                }

                return {
                    loadType: LoadType.PLAYLIST_LOADED,
                    exception: null,
                    tracks: playlist.tracks,
                    playlist: playlist
                }
            }

            case "soundcloud-song": {
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
                    durationFormatted: Util.formatDuration(data.duration),
                    channel: data.user.username,
                    requestedBy: options.requester,
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

            case "soundcloud-playlist": {
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
                    requestedBy: options.requester,
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
                        durationFormatted: Util.formatDuration(item.duration),
                        channel: item.user.username,
                        requestedBy: options.requester,
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

            case "youtube-video-search": {
                const data = await YouTube.searchOne(query);
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
                    requestedBy: options.requester,
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

            case "youtube-search": {
                const data = await YouTube.search(query, { limit: 10 });
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
                        requestedBy: options.requester,
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

            case "soundcloud-search": {
                throw new RangeError("Soundcloud search not supported");
            }
        }
    } catch (error) {
        console.log(error)
        return {
            loadType: LoadType.LOAD_FAILED,
            exception: error,
            tracks: [],
            playlist: null
        }
    }
}


/**
 * Default options for the Search Engine
 * @type {SearchEngineOptions}
 */
const defaultSearchEngineoptions = {
    queryType: "auto",
    requester: "Unknown"
}

/**
 * @typedef SearchEngineOptions
 * @property {string} queryType - Search query type
 * @property {User|string} requester - User who requested the search
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