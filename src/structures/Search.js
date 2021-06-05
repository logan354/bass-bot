//Web functions
const ytdl = require("discord-ytdl-core");
var ytpl = require("ytpl");
const scdl = require("soundcloud-downloader").default;
const spotify = require("spotify-url-info")
const ytsr = require("youtube-sr").default;

//Local functions
const { handleTrack, handlePlaylist } = require("./Track")
const { Util } = require("../utils/Util")

//searchTracks which searchs for the link/query on Youtube, Spotify or Soundcloud
async function searchTracks(message, url, query, queryType) {
    let track, trackInfo;

    //Print searching message
    let searchEmoji;
    if (queryType === "youtube-video" || queryType === "youtube-playlist" || queryType === "youtube-video-keywords") searchEmoji = Util.emojis.youtube;
    if (queryType === "soundcloud-song") searchEmoji = Util.emojis.soundcloud;
    if (queryType === "spotify-song") searchEmoji = Util.emojis.spotify;

    message.channel.send(searchEmoji + " **Searching...** :mag_right: `" + query + "`")



    if (queryType === "youtube-video") {
        try {
            trackInfo = await ytdl.getInfo(url);
            if (!trackInfo) return message.channel.send(":x: **Could not find that link**");

            track = {
                title: trackInfo.videoDetails.title,
                url: trackInfo.videoDetails.video_url,
                displayURL: trackInfo.videoDetails.video_url,
                image: trackInfo.videoDetails.thumbnails[0].url,
                duration: parseInt(trackInfo.videoDetails.lengthSeconds), //Must be in seconds and converted from a string to an integer.
                durationFormatted: Util.formatTime(trackInfo.videoDetails.lengthSeconds), //Must be in seconds
                channel: trackInfo.videoDetails.author.name,
                views: trackInfo.videoDetails.viewCount,
                requestedBy: message.author,
                isLive: trackInfo.videoDetails.isLiveContent,
                source: "youtube",
            }

            if (track.isLive === true || track.duration === 0) {
                track.durationFormatted = "LIVE"
                track.isLive = true
            }

            handleTrack(message, track)

        }
        catch (ex) {
            console.log(ex)
            return message.channel.send(":x: **Error:** Searching link/query: `" + ex.message + "`");
        }
    }



    if (queryType === "youtube-playlist") {
        try {
            const playlist = await ytpl(url.split("list=")[1]);
            if (!playlist) return message.channel.send(":x: **Could not find that link**");

            const videos = await playlist.items;
            for (const video of videos) {

                track = {
                    title: video.title,
                    url: video.url,
                    displayURL: video.url,
                    image: video.thumbnails[0].url,
                    duration: parseInt(video.durationSec), //Must be in seconds and converted from a string to an integer.
                    durationFormatted: video.duration, //Must be in seconds
                    channel: video.author.name,
                    views: null,
                    requestedBy: message.author,
                    isLive: video.isLive,
                    source: "youtube",

                }

                if (track.isLive === true || track.duration === 0) {
                    track.durationFormatted = "LIVE"
                    track.isLive = true
                }

                handlePlaylist(message, track)
            }

            var serverQueue = message.client.queue.get(message.guild.id);
            message.channel.send({
                embed: {
                    color: "BLACK",
                    author: {
                        name: "Playlist added to queue",
                        icon_url: Util.emojis.player
                    },
                    description: `**[${playlist.title}](${playlist.url})**`,
                    thumbnail: { url: playlist.thumbnails[0].url },

                    fields: [

                        { name: "Channel", value: playlist.author.name, inline: true },
                        { name: "Enqueued", value: "`" + playlist.estimatedItemCount + "` " + "songs", inline: true },
                        //{ name: "Song Duration", value: track.durationFormatted, inline: true },
                        //{ name: "Estimated time until playing", value: "?", inline: true }, //Not Accurate

                        { name: "Position in queue", value: (serverQueue.tracks.length) - playlist.estimatedItemCount, inline: true },
                        { name: "\u200B", value: "**Requested by:** " + "<@" + track.requestedBy + ">" }
                    ],
                },
            })

        }
        catch (ex) {
            console.log(ex)
            return message.channel.send(":x: **Error:** Searching link/query: `" + ex.message + "`");
        }
    }



    if (queryType === "soundcloud-song") {
        try {
            trackInfo = await scdl.getInfo(url);
            if (!trackInfo) return message.channel.send(":x: **Could not find that link**");

            track = {
                title: trackInfo.title,
                url: trackInfo.permalink_url,
                displayURL: trackInfo.permalink_url,
                image: trackInfo.artwork_url,
                duration: parseInt(trackInfo.duration / 1000), //Must be in seconds and converted from a string to an integer.
                durationFormatted: Util.formatTime(trackInfo.duration / 1000), //Must be in seconds
                channel: trackInfo.publisher_metadata.artist,
                views: trackInfo.playback_count,
                requestedBy: message.author,
                isLive: null,
                source: "soundcloud",
            }

            handleTrack(message, track)

        } catch (ex) {
            console.log(ex)
            return message.channel.send(":x: **Error:** Searching link/query: `" + ex.message + "`");
        }
    }



    if (queryType === "spotify-song") {
        try {
            trackInfo = await spotify.getData(url);
            if (!trackInfo) return message.channel.send(":x: **Could not find that link**");

            track = {
                title: trackInfo.name,
                url: trackInfo.external_urls.spotify,
                displayURL: trackInfo.external_urls.spotify,
                image: trackInfo.album.images[0].url,
                duration: parseInt(trackInfo.duration_ms / 1000), //Must be in seconds and converted from a string to an integer.
                durationFormatted: Util.formatTime(trackInfo.duration_ms / 1000), //Must be in seconds
                channel: trackInfo.artists[0].name,
                views: null,
                requestedBy: message.author,
                isLive: null,
                source: "spotify",
            }

            query = track.channel + " - " + track.title;

            trackInfo = await ytsr.searchOne(query)
            if (!trackInfo) return message.channel.send(":x: **Could not find that link**");

            track.title = trackInfo.title
            track.url = trackInfo.url
            //track.displayURL = trackInfo.url
            //track.image = trackInfo.thumbnail.url
            track.duration = parseInt(trackInfo.duration / 1000) //Must be in seconds and converted from a string to an integer.
            track.durationFormatted = trackInfo.durationFormatted //Must be in seconds
            //track.channel = trackInfo.channel.name
            //track.views = trackInfo.views
            //track.requestedBy = message.author
            track.isLive = trackInfo.live
            //track.source = "youtube"


            if (track.isLive === true || track.duration === 0) {
                track.durationFormatted = "LIVE"
                track.isLive = true
            }

            handleTrack(message, track)

        }
        catch (ex) {
            console.log(ex)
            return message.channel.send(":x: **Error:** Searching link/query: `" + ex.message + "`");
        }
    }



    if (queryType === "youtube-video-keywords") {
        try {
            trackInfo = await ytsr.searchOne(query)
            if (!trackInfo) return message.channel.send(":x: **No results found on YouTube for** `" + query + "`");

            track = {
                title: trackInfo.title,
                url: trackInfo.url,
                displayURL: trackInfo.url,
                image: trackInfo.thumbnail.url,
                duration: parseInt(trackInfo.duration / 1000), //Must be in seconds and converted from a string to an integer.
                durationFormatted: trackInfo.durationFormatted, //Must be in seconds
                channel: trackInfo.channel.name,
                views: trackInfo.views,
                requestedBy: message.author,
                isLive: trackInfo.live,
                source: "youtube",
            }

            if (track.isLive === true || track.duration === 0) {
                track.durationFormatted = "LIVE"
                track.isLive = true
            }

            handleTrack(message, track)

        }
        catch (ex) {
            console.log(ex)
            return message.channel.send(":x: **Error:** Searching link/query: `" + ex.message + "`");
        }
    }
}

module.exports = { searchTracks }