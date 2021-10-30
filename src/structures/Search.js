const ytdl = require("discord-ytdl-core");
const YouTube = require("youtube-sr").default;
const spotify = require("spotify-url-info");
const scdl = require("soundcloud-downloader").default;

const { ErrorStatusCodes } = require("../utils/types");
const { formatDuration } = require("../utils/formats");

/**
 * Searchs for the query on Youtube, Spotify or Soundcloud
 * @param {string} query User query
 * @param {Object} user Discord.js user object
 * @param {string} queryType Search query type
 * @returns {Object|string}
 */
async function search(query, user, queryType) {
    try {
        switch (queryType) {
            case "youtube-video": {
                const data = await ytdl.getInfo(query);
                if (!data) return ErrorStatusCodes.INVALID_LINK;

                const track = {
                    title: data.videoDetails.title,
                    url: data.videoDetails.video_url,
                    streamURL: data.videoDetails.video_url,
                    thumbnail: data.videoDetails.thumbnails[0].url,
                    duration: parseInt(data.videoDetails.lengthSeconds * 1000),
                    durationFormatted: formatDuration(data.videoDetails.lengthSeconds * 1000),
                    channel: data.videoDetails.author.name,
                    requestedBy: user,
                    isFromPlaylist: false,
                    isLive: data.videoDetails.isLiveContent,
                    source: "youtube"
                }

                if (track.isLive === true || track.duration === 0) {
                    track.durationFormatted = "LIVE";
                    track.isLive = true;
                }

                return { track: track, playlist: null }
            }

            case "youtube-playlist": {
                const data = await YouTube.getPlaylist(query);
                if (!data) return ErrorStatusCodes.INVALID_LINK;

                const playlist = {
                    title: data.title,
                    url: data.url,
                    thumbnail: data.thumbnail,
                    tracks: [],
                    duration: null,
                    durationFormatted: null,
                    channel: data.channel.name,
                    requestedBy: user,
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
                        requestedBy: user,
                        isFromPlaylist: true,
                        isLive: item.live,
                        source: "youtube"
                    }

                    if (track.isLive === true || track.duration === 0) {
                        track.durationFormatted = "LIVE";
                        track.isLive = true;
                    }

                    playlist.tracks.push(track);
                }

                return { track: null, playlist: playlist }
            }

            case "spotify-song": {
                const data = await spotify.getData(query);
                if (!data) return ErrorStatusCodes.INVALID_LINK;

                const track = {
                    title: data.name,
                    url: data.external_urls.spotify,
                    streamURL: data.external_urls.spotify,
                    thumbnail: data.album.images[0].url,
                    duration: parseInt(data.duration_ms),
                    durationFormatted: formatDuration(data.duration_ms),
                    channel: data.artists[0].name,
                    requestedBy: user,
                    isFromPlaylist: false,
                    isLive: false,
                    source: "spotify"
                }

                track.title = track.channel + " - " + track.title;
                return { track: track, playlist: null }
            }

            case "spotify-album":
            case "spotify-playlist": {
                const data = await spotify.getData(query);
                if (!data) return ErrorStatusCodes.INVALID_LINK;

                const playlist = {
                    title: data.name,
                    url: data.external_urls.spotify,
                    thumbnail: data.images[0].url,
                    tracks: [],
                    duration: null,
                    durationFormatted: null,
                    channel: data.owner.display_name,
                    requestedBy: user,
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
                        durationFormatted: formatDuration(item.track.duration_ms),
                        channel: item.track.artists[0].name,
                        requestedBy: user,
                        isFromPlaylist: true,
                        isLive: false,
                        source: "spotify"
                    }

                    track.title = track.channel + " - " + track.title;
                    playlist.tracks.push(track);
                }

                return { track: null, playlist: playlist }
            }

            case "soundcloud-song": {
                const data = await scdl.getInfo(query);
                if (!data) return ErrorStatusCodes.INVALID_LINK;

                const track = {
                    title: data.title,
                    url: data.permalink_url,
                    streamURL: data.permalink_url,
                    thumbnail: data.artwork_url,
                    duration: parseInt(data.duration),
                    durationFormatted: formatDuration(data.duration),
                    channel: data.user.username,
                    requestedBy: user,
                    isFromPlaylist: false,
                    isLive: false,
                    source: "soundcloud"
                }

                return { track: track, playlist: null }
            }

            case "soundcloud-playlist": {
                const data = await scdl.getSetInfo(query);
                if (!data) return ErrorStatusCodes.INVALID_LINK;

                const playlist = {
                    title: data.title,
                    url: data.permalink_url,
                    thumbnail: data.artwork_url,
                    tracks: [],
                    duration: null,
                    durationFormatted: null,
                    channel: data.user.username,
                    requestedBy: user,
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
                        requestedBy: user,
                        isFromPlaylist: true,
                        isLive: false,
                        source: "soundcloud"
                    }

                    playlist.tracks.push(track);
                }

                return { track: null, playlist: playlist }
            }

            case "youtube-video-keywords": {
                const data = await YouTube.searchOne(query);
                if (!data) return ErrorStatusCodes.NO_RESULTS;

                const track = {
                    title: data.title,
                    url: data.url,
                    streamURL: data.url,
                    thumbnail: data.thumbnail.url,
                    duration: parseInt(data.duration),
                    durationFormatted: data.durationFormatted,
                    channel: data.channel.name,
                    requestedBy: user,
                    isFromPlaylist: false,
                    isLive: data.live,
                    source: "youtube"
                }

                if (track.isLive === true || track.duration === 0) {
                    track.durationFormatted = "LIVE";
                    track.isLive = true;
                }

                return { track: track, playlist: null }
            }

            case "custom": {
                const data = await YouTube.search(query, { limit: 10 });
                if (!data) return ErrorStatusCodes.NO_RESULTS;

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
                        requestedBy: message.author,
                        isFromPlaylist: false,
                        isLive: item.live,
                        source: "youtube"
                    }

                    if (track.isLive === true || track.duration === 0) {
                        track.durationFormatted = "LIVE";
                        track.isLive = true;
                    }

                    res.push(track);
                }

                return res;
            }
        }
    } catch (ex) {
        console.log(ex);
        return ErrorStatusCodes.UNKNOWN_ERROR;
    }
}

module.exports = { search }