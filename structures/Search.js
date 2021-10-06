const ytdl = require("discord-ytdl-core");
const YouTube = require("youtube-sr").default;
const spotify = require("spotify-url-info");
const scdl = require("soundcloud-downloader").default;

const { player } = require("./Player");
const { formatDuration } = require("../utils/Formatting");

/**
 * Resolves query type
 * @param {string} query User query
 * @returns {string}
 */
function resolveQueryType(query) {
    //Playlists
    if (query.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) return "youtube-playlist";

    if (query.match(/https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:album\/|\?uri=spotify:album:)((\w|-){22})/)) return "spotify-album";

    if (query.match(/https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:playlist\/|\?uri=spotify:playlist:)((\w|-){22})/)) return "spotify-playlist";

    if (query.match(/^https?:\/\/(soundcloud\.com|snd\.sc)\/([A-Za-z0-9_-]+)\/sets\/([A-Za-z0-9_-]+)\/?$/)) return "soundcloud-playlist";

    //Videos
    if (query.match(/^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi)) return "youtube-video";

    if (query.match(/https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:track\/|\?uri=spotify:track:)((\w|-){22})/)) return "spotify-song";

    if (query.match(/^https?:\/\/(soundcloud\.com)\/(.*)$/gi)) return "soundcloud-song";

    //Else
    return "youtube-video-keywords";
}

/**
 * Handles tracks
 * @param {object} message Discord.js message object
 * @param {object} track Track data
 * @returns {Promise}
 */
function handleTrack(message, track) {
    const serverQueue = message.client.queues.get(message.guild.id);

    if (serverQueue.tracks.length > 0) {
        serverQueue.tracks.push(track);
        return message.channel.send({
            embed: {
                color: "BLACK",
                author: {
                    name: "Added to queue",
                    icon_url: message.client.emotes.player,
                },
                description: `**[${track.title}](${track.url})**`,
                thumbnail: { url: track.thumbnail },
                fields: [
                    { name: "Channel", value: track.channel, inline: true },
                    { name: "Song Duration", value: track.durationFormatted, inline: true },
                    //{ name: "Estimated time until QUEUEING", value: "?", inline: true }, //Not Accurate
                    { name: "Position in queue", value: serverQueue.tracks.length - 1, inline: true },

                    { name: "\u200B", value: "**Requested by:** " + "<@" + track.requestedBy + ">" }
                ],
            },
        });
    }

    serverQueue.tracks.push(track);
    player(message, serverQueue.tracks[0]);
}

/**
 * Handles playlists
 * @param {object} message Discord.js message object
 * @param {object} playlist Playlist data 
 * @returns {Promise}
 */
function handlePlaylist(message, playlist) {
    console.log(playlist)
    const serverQueue = message.client.queues.get(message.guild.id);

    if (serverQueue.tracks.length > 0) {
        serverQueue.tracks.push(...playlist.tracks);
    } else {
        serverQueue.tracks.push(...playlist.tracks);
        player(message, serverQueue.tracks[0]);
    }

    message.channel.send({
        embed: {
            color: "BLACK",
            author: {
                name: "Playlist added to queue",
                icon_url: message.client.emotes.player
            },
            description: `**[${playlist.title}](${playlist.url})**`,
            thumbnail: { url: playlist.thumbnail },
            fields: [
                { name: "Channel", value: playlist.channel, inline: true },
                { name: "Enqueued", value: "`" + playlist.tracks.length + "` " + "songs", inline: true },
                //{ name: "Estimated time until playing", value: "?", inline: true }, //Not Accurate
                { name: "Position in queue", value: (serverQueue.tracks.length) - playlist.tracks.length, inline: true },

                { name: "\u200B", value: "**Requested by:** " + "<@" + playlist.requestedBy + ">" }
            ],
        },
    });
}

/**
 * Searchs for the query on Youtube, Spotify or Soundcloud
 * @param {object} message Discord.js message object
 * @param {string} query User query
 * @param {string} queryType Search query type
 * @returns {Promise}
 */
async function searchTracks(message, query) {
    const serverQueue = message.client.queues.get(message.guild.id);
    const queryType = resolveQueryType(query);

    //Display searching message
    let searchEmoji;
    if (queryType.includes("youtube")) searchEmoji = message.client.emotes.youtube;
    if (queryType.includes("soundcloud")) searchEmoji = message.client.emotes.soundcloud;
    if (queryType.includes("spotify")) searchEmoji = message.client.emotes.spotify;
    message.channel.send(searchEmoji + " **Searching...** :mag_right: `" + query + "`");

    switch (queryType) {
        case "youtube-video": {
            try {
                const data = await ytdl.getInfo(query);
                if (!data) return message.channel.send(message.client.emotes.error + " **Could not find that link**");

                const track = {
                    title: data.videoDetails.title,
                    url: data.videoDetails.video_url,
                    streamURL: data.videoDetails.video_url,
                    thumbnail: data.videoDetails.thumbnails[0].url,
                    duration: parseInt(data.videoDetails.lengthSeconds * 1000),
                    durationFormatted: formatDuration(data.videoDetails.lengthSeconds * 1000),
                    channel: data.videoDetails.author.name,
                    requestedBy: message.author,
                    isFromPlaylist: false,
                    isLive: data.videoDetails.isLiveContent,
                    source: "youtube"
                }

                if (track.isLive === true || track.duration === 0) {
                    track.durationFormatted = "LIVE";
                    track.isLive = true;
                }

                handleTrack(message, track);
            } catch (ex) {
                console.log(ex);
                return message.channel.send(message.client.emotes.error + " **Error: Searching:** `" + ex.message + "`");
            }
        }
            break;

        case "youtube-playlist": {
            try {
                const data = await YouTube.getPlaylist(query);
                if (!data) return message.channel.send(message.client.emotes.error + " **Could not find that link**");

                const playlist = {
                    title: data.title,
                    url: data.url,
                    thumbnail: data.thumbnail,
                    tracks: [],
                    duration: null,
                    durationFormatted: null,
                    channel: data.channel.name,
                    requestedBy: message.author,
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
                        requestedBy: message.author,
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

                handlePlaylist(message, playlist);
            } catch (ex) {
                console.log(ex);
                return message.channel.send(message.client.emotes.error + " **Error: Searching:** `" + ex.message + "`");
            }
        }
            break;

        case "spotify-song": {
            try {
                const data = await spotify.getData(query);
                if (!data) return message.channel.send(message.client.emotes.error + " **Could not find that link**");

                const track = {
                    title: data.name,
                    url: data.external_urls.spotify,
                    streamURL: data.external_urls.spotify,
                    thumbnail: data.album.images[0].url,
                    duration: parseInt(data.duration_ms),
                    durationFormatted: formatDuration(data.duration_ms),
                    channel: data.artists[0].name,
                    requestedBy: message.author,
                    isFromPlaylist: false,
                    isLive: false,
                    source: "spotify"
                }

                track.title = track.channel + " - " + track.title;
                handleTrack(message, track);
            } catch (ex) {
                console.log(ex);
                return message.channel.send(message.client.emotes.error + " **Error: Searching:** `" + ex.message + "`");
            }
        }
            break;

        case "spotify-album":
        case "spotify-playlist": {
            try {
                const data = await spotify.getData(query);
                if (!data) return message.channel.send(message.client.emotes.error + " **Could not find that link**");

                const playlist = {
                    title: data.name,
                    url: data.external_urls.spotify,
                    thumbnail: data.images[0].url,
                    tracks: [],
                    duration: null,
                    durationFormatted: null,
                    channel: data.owner.display_name,
                    requestedBy: message.author,
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
                        requestedBy: message.author,
                        isFromPlaylist: true,
                        isLive: false,
                        source: "spotify"
                    }

                    track.title = track.channel + " - " + track.title;
                    playlist.tracks.push(track);
                }

                handlePlaylist(message, playlist);
            } catch (ex) {
                console.log(ex);
                return message.channel.send(message.client.emotes.error + " **Error: Searching:** `" + ex.message + "`");
            }
        }
            break;

        case "soundcloud-song": {
            try {
                const data = await scdl.getInfo(query);
                if (!data) return message.channel.send(message.client.emotes.error + " **Could not find that link**");

                const track = {
                    title: data.title,
                    url: data.permalink_url,
                    streamURL: data.permalink_url,
                    thumbnail: data.artwork_url,
                    duration: parseInt(data.duration),
                    durationFormatted: formatDuration(data.duration),
                    channel: data.user.username,
                    requestedBy: message.author,
                    isFromPlaylist: false,
                    isLive: false,
                    source: "soundcloud"
                }

                handleTrack(message, track);
            } catch (ex) {
                console.log(ex);
                return message.channel.send(message.client.emotes.error + " **Error: Searching:** `" + ex.message + "`");
            }
        }
            break;

        case "soundcloud-playlist": {
            try {
                const data = await scdl.getSetInfo(query);
                if (!data) return message.channel.send(message.client.emotes.error + " **Could not find that link**");

                const playlist = {
                    title: data.title,
                    url: data.permalink_url,
                    thumbnail: data.artwork_url,
                    tracks: [],
                    duration: null,
                    durationFormatted: null,
                    channel: data.user.username,
                    requestedBy: message.author,
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
                        requestedBy: message.author,
                        isFromPlaylist: true,
                        isLive: false,
                        source: "soundcloud"
                    }

                    playlist.tracks.push(track);
                }

                handlePlaylist(message, playlist);
            } catch (ex) {
                console.log(ex);
                return message.channel.send(message.client.emotes.error + " **Error: Searching:** `" + ex.message + "`");
            }
        }
            break;

        case "youtube-video-keywords": {
            try {
                const data = await YouTube.searchOne(query);
                if (!data) return message.channel.send(message.client.emotes.error + " **No results found on YouTube for** `" + query + "`");

                const track = {
                    title: data.title,
                    url: data.url,
                    streamURL: data.url,
                    thumbnail: data.thumbnail.url,
                    duration: parseInt(data.duration),
                    durationFormatted: data.durationFormatted,
                    channel: data.channel.name,
                    requestedBy: message.author,
                    isFromPlaylist: false,
                    isLive: data.live,
                    source: "youtube"
                }

                if (track.isLive === true || track.duration === 0) {
                    track.durationFormatted = "LIVE";
                    track.isLive = true;
                }

                handleTrack(message, track);
            } catch (ex) {
                console.log(ex);
                return message.channel.send(message.client.emotes.error + " **Error: Searching:** `" + ex.message + "`");
            }
        }
            break;
    }
}

module.exports = { searchTracks }