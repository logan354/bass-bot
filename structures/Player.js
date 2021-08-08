const ytdl = require("discord-ytdl-core");
const scdl = require("soundcloud-downloader").default;

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

    if (!track) return;
    
    let streamOptions = {
        filter: track.isLive ? "audio" : "audioonly", //filter: audioonly does not work with livestreams
        quality: "highestaudio",
        highWaterMark: 1 << 25,
        opusEncoded: true,
        seek: seekTime / 1000
    }

    try {
        if (track.source === "soundcloud") {
            stream = ytdl.arbitraryStream(await scdl.download(track.streamURL), streamOptions);
            streamType = "opus";
        } else if (track.source === "youtube" || "spotify") {
            stream = ytdl(track.streamURL, streamOptions); 
            streamType = "opus";
        }
        stream.on("error", (ex) => {
            if (ex) {
                if (queue) {
                    queue.tracks.shift();
                    player(message, queue.tracks[0]);
                    console.log(ex);
                    return message.channel.send(message.client.emotes.error + " **Error: Playing:** `" + ex.message + "`");
                }
            }
        });
    } catch (ex) {
        if (queue) {
            queue.tracks.shift();
            player(message, queue.tracks[0]);
            console.log(ex);
            return message.channel.send(message.client.emotes.error + " **Error: Playing:** `" + ex.message + "`");
        }
    }

    //Start the stream and set actions on finish
    queue.connection.on("disconnect", () => message.client.queues.delete(message.guild.id));
    const dispatcher = queue.connection.play(stream, { type: streamType }).on("finish", () => {

        //Check if queue is loopped or track is loopped
        if (queue.loop === true) {
            player(message, queue.tracks[0]);
        }
        else if (queue.loopQueue === true) {
            const shiffed = queue.tracks.shift();
            queue.tracks.push(shiffed);
            player(message, queue.tracks[0]);
        }
        else {
            //Variables that need to be reset
            queue.skiplist = [];
            queue.tracks.shift();
            player(message, queue.tracks[0]);
        }

        handleEndCooldown(message);
    });

    //Set volume
    dispatcher.setVolumeLogarithmic(queue.volume / 100);

    //Show playing message
    if (!streamOptions.seek) message.channel.send(message.client.emotes.playerFrozen + " **Now Playing** `" + track.title + "`");

    //Pause the stream if queue.playing === false
    if (queue.playing === false) {
        try {
            dispatcher.pause();
        } catch (ex) {
            console.log(ex);
            return message.channel.send(message.client.emotes.error + " **Error:** `Pausing`");
        }
        handleStopCooldown(message);
    }
}

module.exports = { player }