const { createAudioResource, StreamType, AudioPlayerStatus } = require("@discordjs/voice");
const ytdl = require("discord-ytdl-core");
const YouTube = require("youtube-sr").default;
const scdl = require("soundcloud-downloader").default;

const { handleEndCooldown, handleStopCooldown } = require("./cooldowns");

/**
 * Creates and streams audio
 * @param {Object} data Discord.js message or interaction object
 * @param {Object} track Track data
 * @param {Object} options Player options
 * @returns {Object|void}
 */
async function player(data, track, options = { seek: 0, filters: null }) {
    const serverQueue = data.client.queues.get(data.guild.id);
    let stream;

    if (!track) {
        handleEndCooldown(data);
        return;
    }

    let streamOptions = {
        filter: track.isLive ? "audio" : "audioonly", // filter: audioonly does not work with livestreams
        quality: "highestaudio",
        highWaterMark: 1 << 25,
        opusEncoded: false,
        seek: options.seek / 1000
    }

    // Download readable stream
    if (track.source === "youtube" || track.source === "spotify") {
        if (track.source === "spotify") {
            const streamData = await YouTube.searchOne(track.title);
            if (!streamData) return; //Error Handle for the player

            track.title = streamData.title;
            //track.url = streamData.url;
            track.streamURL = streamData.url
            //track.thumbnail = streamData.thumbnail.url
            track.duration = parseInt(streamData.duration);
            track.durationFormatted = streamData.durationFormatted;
            //track.channel = streamData.channel.name
            //track.requestedBy = message.author
            //track.isFromPlaylist = true
            track.isLive = streamData.live;
            //track.source = "youtube"

            if (track.isLive === true || track.duration === 0) {
                track.durationFormatted = "LIVE";
                track.isLive = true;
            }
        }
        stream = ytdl(track.streamURL, streamOptions);
    } else if (track.source === "soundcloud") {
        stream = ytdl.arbitraryStream(await scdl.download(track.streamURL), streamOptions);
    }

    stream.on("error", (error) => {
        // HTTP request destroyed, retry request
        if (error.message === "Status code: 403") {
            serverQueue.skiplist = [];
            serverQueue.additionalStreamTime = 0;
            player(data, serverQueue.tracks[0]);
            return;
        }
        // Unknown error, play the next track 
        else {
            console.log(error);
            data.channel.send(`${data.client.emotes.error} **An error occurred while trying to play**` + "`" + track.title + "`");

            serverQueue.skiplist = [];
            serverQueue.additionalStreamTime = 0;
            serverQueue.tracks.shift();
            player(data, serverQueue.tracks[0]);
            return;
        }
    });

    // Create audio resource for audio player
    const resource = createAudioResource(stream, {
        inputType: StreamType.Raw,
        metadata: track,
        inlineVolume: true
    });


    if (options.seek) serverQueue.additionalStreamTime = options.seek;

    // Play audio resource across audio player
    serverQueue.streamDispatcher.audioPlayer.play(resource);

    // Configure audio player
    serverQueue.streamDispatcher.audioPlayer.on("stateChange", (oldState, newState) => {
        if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
            // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
            // The queue is then processed to start playing the next track, if one is available.

            serverQueue.skiplist = [];
            serverQueue.additionalStreamTime = 0;

            if (serverQueue.loop === true) {
                player(data, serverQueue.tracks[0]);
            } else if (serverQueue.loopQueue === true) {
                const shiffed = serverQueue.tracks.shift();
                serverQueue.tracks.push(shiffed);
                player(data, serverQueue.tracks[0]);
            } else {
                serverQueue.tracks.shift();
                player(data, serverQueue.tracks[0]);
            }
        } else if (newState.status === AudioPlayerStatus.Playing) {
            // If the Playing state has been entered, then a new track has started playback.
        }
    });

    serverQueue.streamDispatcher.audioPlayer.on("error", (error) => {
        console.log(error);
        data.channel.send(`${data.client.emotes.error} **An error occurred while playing**` + "`" + track.title + "`");
    });

    // Check if the queue is paused
    if (serverQueue.paused) {
        serverQueue.streamDispatcher.audioPlayer.pause();
        handleStopCooldown(data);
    }

    return track;
}

module.exports = { player }