const ytdl = require("discord-ytdl-core");
const YouTube = require("youtube-sr").default;
const spotify = require("spotify-url-info");
const scdl = require("soundcloud-downloader").default;

const { formatDuration } = require("../utils/Formatting");
const { player } = require("./Player");

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
    let track, trackInfo, queryType;
    const serverQueue = message.client.queues.get(message.guild.id);

    //Handles query
    if (typeof query === 'string') query = query.replace(/<(.+)>/g, '$1');
    queryType = resolveQueryType(query);

    //Print searching message
    let searchEmoji;
    if (queryType === "youtube-video" || queryType === "youtube-playlist" || queryType === "youtube-video-keywords") searchEmoji = message.client.emotes.youtube;
    if (queryType === "soundcloud-song") searchEmoji = message.client.emotes.soundcloud;
    if (queryType === "spotify-song" || queryType === "spotify-album" || queryType === "spotify-playlist") searchEmoji = message.client.emotes.spotify;
    message.channel.send(searchEmoji + " **Searching...** :mag_right: `" + query + "`");

    switch (queryType) {
        case "youtube-video": {
            try {
                trackInfo = await ytdl.getInfo(query);
                if (!trackInfo) return message.channel.send(message.client.emotes.error + " **Could not find that link**");

                track = {
                    title: trackInfo.videoDetails.title,
                    url: trackInfo.videoDetails.video_url,
                    streamURL: trackInfo.videoDetails.video_url,
                    thumbnail: trackInfo.videoDetails.thumbnails[0].url,
                    duration: parseInt(trackInfo.videoDetails.lengthSeconds * 1000),
                    durationFormatted: formatDuration(trackInfo.videoDetails.lengthSeconds * 1000),
                    channel: trackInfo.videoDetails.author.name,
                    views: trackInfo.videoDetails.viewCount,
                    requestedBy: message.author,
                    isFromPlaylist: false,
                    isLive: trackInfo.videoDetails.isLiveContent,
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
                const playlist = await YouTube.getPlaylist(query);
                if (!playlist) return message.channel.send(message.client.emotes.error + " **Could not find that link**");

                const videos = await playlist.videos;
                for (const video of videos) {

                    track = {
                        title: video.title,
                        url: video.url,
                        streamURL: video.url,
                        thumbnail: video.thumbnail.url,
                        duration: parseInt(video.duration),
                        durationFormatted: video.durationFormatted,
                        channel: video.channel.name,
                        views: video.views,
                        requestedBy: message.author,
                        isFromPlaylist: true,
                        isLive: video.live,
                        source: "youtube"
                    }

                    if (track.isLive === true || track.duration === 0) {
                        track.durationFormatted = "LIVE";
                        track.isLive = true;
                    }

                    handleTrack(message, track);
                }

                return message.channel.send({
                    embed: {
                        color: "BLACK",
                        author: {
                            name: "Playlist added to queue",
                            icon_url: message.client.emotes.player
                        },
                        description: `**[${playlist.title}](${playlist.url})**`,
                        thumbnail: { url: playlist.thumbnail },
                        fields: [
                            { name: "Channel", value: playlist.channel.name, inline: true },
                            { name: "Enqueued", value: "`" + playlist.videoCount + "` " + "songs", inline: true },
                            //{ name: "Estimated time until playing", value: "?", inline: true }, //Not Accurate
                            { name: "Position in queue", value: (serverQueue.tracks.length) - playlist.videoCount, inline: true },

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
                trackInfo = await spotify.getData(query);
                if (!trackInfo) return message.channel.send(message.client.emotes.error + " **Could not find that link**");
                
                track = {
                    title: trackInfo.name,
                    url: trackInfo.external_urls.spotify,
                    streamURL: trackInfo.external_urls.spotify,
                    thumbnail: trackInfo.album.images[0].url,
                    duration: parseInt(trackInfo.duration_ms),
                    durationFormatted: formatDuration(trackInfo.duration_ms),
                    channel: trackInfo.artists[0].name,
                    views: 0,
                    requestedBy: message.author,
                    isFromPlaylist: false,
                    isLive: false,
                    source: "spotify"
                }

                query = track.channel + " - " + track.title;

                trackInfo = await YouTube.searchOne(query);
                if (!trackInfo) return message.channel.send(message.client.emotes.error + " **Could not find that link**");

                track.title = query;
                //track.url = trackInfo.url;
                track.streamURL = trackInfo.url
                //track.thumbnail = trackInfo.thumbnail.url
                track.duration = parseInt(trackInfo.duration);
                track.durationFormatted = trackInfo.durationFormatted;
                //track.channel = trackInfo.channel.name
                //track.views = trackInfo.views
                track.requestedBy = message.author
                track.isFromPlaylist = false
                track.isLive = trackInfo.live;
                //track.source = "youtube"

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

        case "soundcloud-song": {
            try {
                trackInfo = await scdl.getInfo(query);
                if (!trackInfo) return message.channel.send(message.client.emotes.error + " **Could not find that link**");

                track = {
                    title: trackInfo.title,
                    url: trackInfo.permalink_url,
                    streamURL: trackInfo.permalink_url,
                    thumbnail: trackInfo.artwork_url,
                    duration: parseInt(trackInfo.duration),
                    durationFormatted: formatDuration(trackInfo.duration),
                    channel: trackInfo.publisher_metadata.artist,
                    views: trackInfo.playback_count,
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
                trackInfo = await YouTube.searchOne(query);
                if (!trackInfo) return message.channel.send(message.client.emotes.error + " **No results found on YouTube for** `" + query + "`");

                track = {
                    title: trackInfo.title,
                    url: trackInfo.url,
                    streamURL: trackInfo.url,
                    thumbnail: trackInfo.thumbnail.url,
                    duration: parseInt(trackInfo.duration),
                    durationFormatted: trackInfo.durationFormatted,
                    channel: trackInfo.channel.name,
                    views: trackInfo.views,
                    requestedBy: message.author,
                    isFromPlaylist: false,
                    isLive: trackInfo.live,
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