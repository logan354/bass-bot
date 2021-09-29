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

    //Videos
    if (query.match(/^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi)) return "youtube-video";

    if (query.match(/^https?:\/\/(soundcloud\.com)\/(.*)$/gi)) return "soundcloud-song";

    if (query.match(/https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:track\/|\?uri=spotify:track:)((\w|-){22})/)) return "spotify-song";

    //Else
    return "youtube-video-keywords";
}

/**
 * Handles tracks
 * @param {object} message Discord.js message object
 * @param {object} track Track info
 * @returns {Promise}
 */
function handleTrack(message, track) {
    const serverQueue = message.client.queues.get(message.guild.id);

    if (serverQueue.tracks.length > 0) {
        serverQueue.tracks.push(track);
        if (track.isFromPlaylist === true) return;
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

                    { name: "\u200B", value: "**Requested by:** " + "<@" + track.requestedBy.id + ">" }
                ],
            },
        });
    }

    serverQueue.tracks.push(track);
    player(message, serverQueue.tracks[0]);
}

/**
 * Searchs for the query on Youtube, Spotify or Soundcloud
 * @param {object} message Discord.js message object
 * @param {string} query User query
 * @returns {Promise}
 */
async function searchTracks(message, query) {
    const serverQueue = message.client.queues.get(message.guild.id);

    //Handles query
    if (typeof query === "string") query = query.replace(/<(.+)>/g, "$1");
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

                const list = await data.videos;

                for (const item of list) {
                    var track = {
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

                    handleTrack(message, track);
                }

                message.channel.send({
                    embed: {
                        color: "BLACK",
                        author: {
                            name: "Playlist added to queue",
                            icon_url: message.client.emotes.player
                        },
                        description: `**[${data.title}](${data.url})**`,
                        thumbnail: { url: data.thumbnail },
                        fields: [
                            { name: "Channel", value: data.channel.name, inline: true },
                            { name: "Enqueued", value: "`" + data.videoCount + "` " + "songs", inline: true },
                            //{ name: "Estimated time until playing", value: "?", inline: true }, //Not Accurate
                            { name: "Position in queue", value: (serverQueue.tracks.length) - data.videoCount, inline: true },

                            { name: "\u200B", value: "**Requested by:** " + "<@" + track.requestedBy + ">" }
                        ],
                    },
                });
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

                const list = await data.tracks.items;

                for (let item of list) {
                    var track = {
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
                    handleTrack(message, track);
                }

                message.channel.send({
                    embed: {
                        color: "BLACK",
                        author: {
                            name: "Playlist added to queue",
                            icon_url: message.client.emotes.player
                        },
                        description: `**[${data.name}](${data.external_urls.spotify})**`,
                        thumbnail: { url: data.images[0].url },
                        fields: [
                            { name: "Channel", value: data.owner.display_name, inline: true },
                            { name: "Enqueued", value: "`" + data.tracks.total + "` " + "songs", inline: true },
                            //{ name: "Estimated time until playing", value: "?", inline: true }, //Not Accurate
                            { name: "Position in queue", value: (serverQueue.tracks.length) - data.tracks.total, inline: true },

                            { name: "\u200B", value: "**Requested by:** " + "<@" + track.requestedBy + ">" }
                        ],
                    },
                });
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
                    channel: data.publisher_metadata.artist,
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