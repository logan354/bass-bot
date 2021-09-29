const ytdl = require("discord-ytdl-core");
const scdl = require("soundcloud-downloader").default;
const YouTube = require("youtube-sr").default;

const { handleEndCooldown, handleStopCooldown } = require("./Cooldowns");

/**
 * Creates and streams audio
 * @param {object} message Discord.js message object
 * @param {object} track Track info
 * @param {number} seekTime Seek time
 * @returns {Promise}
 */
async function player(message, track, seekTime) {
    const queue = message.client.queues.get(message.guild.id);
    let stream, streamType;
    let streamOptions = {
        filter: track.isLive ? "audio" : "audioonly", //filter: audioonly does not work with livestreams
        quality: "highestaudio",
        highWaterMark: 1 << 25,
        opusEncoded: true,
        seek: seekTime / 1000
    }

    //Add additional stream time
    if (seekTime) queue.additionalStreamTime = seekTime;

    //Check if a track is definded 
    if (!track) {
        handleEndCooldown(message);
        return;
    }

    //Download readable stream
    try {
        if (track.source === "youtube" || "spotify") {
            if (track.source === "spotify") {
                const streamData = await YouTube.searchOne(track.title);
                if (!streamData) return message.channel.send(message.client.emotes.error + " **Could not find that link**");

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
            streamType = "opus";
        } else if (track.source === "soundcloud") {
            stream = ytdl.arbitraryStream(await scdl.download(track.streamURL), streamOptions);
            streamType = "opus";
        }

        stream.on("error", (ex) => {
            if (ex) {
                if (queue) {
                    queue.skiplist = [];
                    queue.additionalStreamTime = 0;
                    queue.tracks.shift();
                    player(message, queue.tracks[0]);
                    console.log(ex);
                    return message.channel.send(message.client.emotes.error + " **Error: Playing:** `" + ex.message + "`");
                }
            }
        });
    } catch (ex) {
        if (queue) {
            queue.skiplist = [];
            queue.additionalStreamTime = 0;
            queue.tracks.shift();
            player(message, queue.tracks[0]);
            console.log(ex);
            return message.channel.send(message.client.emotes.error + " **Error: Playing:** `" + ex.message + "`");
        }
    }

    //Stream readable stream in Discord
    queue.connection.on("disconnect", () => message.client.queues.delete(message.guild.id));
    const dispatcher = queue.connection.play(stream, { type: streamType }).on("finish", () => {

        queue.skiplist = [];
        queue.additionalStreamTime = 0;

        if (queue.loop === true) {
            player(message, queue.tracks[0]);
        } else if (queue.loopQueue === true) {
            const shiffed = queue.tracks.shift();
            queue.tracks.push(shiffed);
            player(message, queue.tracks[0]);
        } else {
            queue.tracks.shift();
            player(message, queue.tracks[0]);
        }
    });

    //Set volume
    dispatcher.setVolumeLogarithmic(queue.volume / 100);

    //Check if the queue is paused
    if (queue.playing === false) {
        try {
            dispatcher.pause();
        } catch (ex) {
            console.log(ex);
            return message.channel.send(message.client.emotes.error + " **Error:** `Pausing`");
        }
        handleStopCooldown(message);
    }

    //Display playing message
    if (!seekTime) message.channel.send(message.client.emotes.playerFrozen + " **Now Playing** `" + track.title + "`");
}

module.exports = { player }