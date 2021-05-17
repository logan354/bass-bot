const ytdl = require('discord-ytdl-core');
var ytpl = require('ytpl');
const ytsr = require('youtube-sr').default;
const spotify = require('spotify-url-info')
const scdl = require('soundcloud-downloader').default;
const { handleTrack, handlePlaylist } = require('./Track')
const { formatTime } = require("../structures/Util")

//resolveQueryType resolves which query the user input is
function resolveQueryType(url, query) {

    let queryType;
    //Playlists
    if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) queryType = 'youtube-playlist'

    //Video/Track
    else if (url.match(/^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi)) queryType = 'youtube-video'

    else if (url.match(/^https?:\/\/(soundcloud\.com)\/(.*)$/gi)) queryType = 'soundcloud-song'

    else if (url.match(/https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:track\/|\?uri=spotify:track:)((\w|-){22})/)) queryType = 'spotify-song'

    else queryType = 'youtube-video-keywords'

    return queryType;
}



//searchTracks which searchs for the link/query on Youtube, Spotify or Soundcloud
async function searchTracks(message, url, query, queryType) {

    let track, trackInfo;

    //Print searching message
    message.channel.send(':mag_right: - **Searching** `' + query + '`')

    if (queryType === 'youtube-video') {
        try {
            trackInfo = await ytdl.getInfo(url);
            if (!trackInfo) return message.channel.send(':x: - **Could not find that link**');

            track = {
                title: trackInfo.videoDetails.title,
                url: trackInfo.videoDetails.video_url,
                image: trackInfo.videoDetails.thumbnails[0].url,
                duration: trackInfo.videoDetails.lengthSeconds, //track.duration must be seconds
                durationFormatted: formatTime(trackInfo.videoDetails.lengthSeconds), //Input must be seconds
                channel: trackInfo.videoDetails.author.name,
                views: trackInfo.videoDetails.viewCount,
                requestedBy: message.author,
                isLive: trackInfo.videoDetails.isLiveContent,
            }

            if (track.isLive === true || track.duration === 0) {
                track.durationFormatted = 'LIVE'
                track.isLive = true
            }

            handleTrack(message, track)

        }
        catch (ex) {
            console.log(ex)
            if (ex.message === 'Video unavailable') return message.channel.send(':x: - **Could not find that link**');
            return message.channel.send(':x: - **Error: Searching link/query: Status code: ERR_SEARCHING**');
        }
    }



    if (queryType === 'youtube-playlist') {
        try {
            const playlist = await ytpl(url.split("list=")[1]);
            if (!playlist) return message.channel.send(':x: - **Could not find that link**');

            const videos = await playlist.items;
            for (const video of videos) {

                track = {
                    title: video.title,
                    url: video.url,
                    image: video.thumbnails[0].url,
                    duration: video.durationSec, //track.duration must be seconds
                    durationFormatted: video.duration,
                    channel: video.author.name,
                    views: null,
                    requestedBy: message.author,
                    isLive: video.isLive,

                }

                if (track.isLive === true || track.duration === 0) {
                    track.durationFormatted = 'LIVE'
                    track.isLive = true
                }

                handlePlaylist(message, track)
            }

            var serverQueue = message.client.queue.get(message.guild.id);
            message.channel.send({
                embed: {
                    color: 'BLACK',
                    author: {
                        name: 'Playlist added to queue',
                        icon_url: 'https://media2.giphy.com/media/LwBTamVefKJxmYwDba/giphy.gif?cid=6c09b952a802c7s4bkq4n5kc0tcp1il42k0uqfoo4p0bx3xl&rid=giphy.gif'
                    },
                    description: `**[${playlist.title}](${playlist.url})**`,
                    thumbnail: { url: playlist.thumbnails[0].url },

                    fields: [

                        { name: 'Channel', value: playlist.author.name, inline: true },
                        { name: 'Enqueued', value: '`' + playlist.estimatedItemCount + '` ' + 'songs', inline: true },
                        //{ name: 'Song Duration', value: track.durationFormatted, inline: true },
                        //{ name: 'Estimated time until playing', value: '?', inline: true }, //Not Accurate

                        { name: 'Position in queue', value: (serverQueue.tracks.length) - playlist.estimatedItemCount, inline: true },
                        { name: '\u200B', value: '**Requested by:** ' + '<@' + track.requestedBy + '>' }
                    ],
                },
            })

        }
        catch (ex) {
            console.log(ex)
            return message.channel.send(':x: - **Error: Searching link/query: Status code: ERR_SEARCHING**');
        }
    }



    if (queryType === 'soundcloud-song') {
        try {
            trackInfo = await scdl.getInfo(url);
            if (!trackInfo) return message.channel.send(':x: - **Could not find that link**');

            track = {
                title: trackInfo.title,
                url: trackInfo.permalink_url,
                image: trackInfo.artwork_url,
                duration: trackInfo.duration / 1000, //track.duration must be seconds
                durationFormatted: formatTime(trackInfo.duration / 1000), //Input must be seconds
                channel: trackInfo.publisher_metadata.artist,
                views: trackInfo.playback_count,
                requestedBy: message.author,
                isLive: null,
            }

            handleTrack(message, track)

        } catch (ex) {
            console.log(ex)
            return message.channel.send(':x: - **Error: Searching link/query: Status code: ERR_SEARCHING**');
        }
    }



    if (queryType === 'spotify-song') {
        try {
            trackInfo = await spotify.getPreview(url);
            if (!trackInfo) return message.channel.send(':x: - **Could not find that link**');

            track = {
                title: trackInfo.title,
                url: trackInfo.link,
                image: trackInfo.image,
                duration: null,
                durationFormatted: null,
                channel: trackInfo.artist,
                views: null,
                requestedBy: message.author,
                isLive: null,
            }

            query = track.channel + ' - ' + track.title;
            queryType = 'youtube-video-keywords';


        } catch (ex) {
            console.log(ex)
            return message.channel.send(':x: - **Error: Searching link/query: Status code: ERR_SEARCHING**');
        }
    }



    if (queryType === 'youtube-video-keywords') {
        try {
            trackInfo = await ytsr.searchOne(query)
            if (!trackInfo) return message.channel.send(':x: - **No results found on YouTube for** `' + query + '`');

            track = {
                title: trackInfo.title,
                url: trackInfo.url,
                image: trackInfo.thumbnail.url,
                duration: trackInfo.duration / 1000, //track.duration must be seconds
                durationFormatted: trackInfo.durationFormatted, //Input must be seconds
                channel: trackInfo.channel.name,
                views: trackInfo.views,
                requestedBy: message.author,
                isLive: trackInfo.live,
            }

            if (track.isLive === true || track.duration === 0) {
                track.durationFormatted = 'LIVE'
                track.isLive = true
            }

            handleTrack(message, track)

        }
        catch (ex) {
            console.log(ex)
            return message.channel.send(':x: - **Error: Searching link/query: Status code: ERR_SEARCHING**');
        }
    }


}

module.exports = { resolveQueryType, searchTracks }