const ytdl = require("discord-ytdl-core");
const scdl = require("soundcloud-downloader").default;

const { handleEndCooldown, handleStopCooldown } = require("./Cooldowns");

async function player(message, track, seek) {
    const queue = message.client.queues.get(message.guild.id);
    let stream, streamType;

    if (!track) return;

    try {
        if (track.source === "soundcloud") {
            try {
                stream = await scdl.downloadFormat(track.streamURL, scdl.FORMATS.OPUS);
            } catch (ex) {
                stream = await scdl.downloadFormat(track.streamURL, scdl.FORMATS.MP3);
                streamType = "unknown";
            }
        } else if (track.source === "youtube.com" || "spotify.com") {
            stream = await ytdl(track.streamURL, { filter: "audio", quality: "highestaudio", highWaterMark: 1 << 25, opusEncoded: true }); //filter: audioonly does not work with livestreams
            streamType = "opus";
            stream.on("error", function (ex) {
                if (ex) {
                    if (queue) {
                        queue.tracks.shift();
                        player(message, queue.tracks[0]);
                        console.log(ex);
                        return message.channel.send(message.client.emotes.error + " **Error: Playing:** `" + ex.message + "`");
                    }
                }
            });
        }
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
    message.channel.send(message.client.emotes.playerFrozen + " **Now Playing** `" + track.title + "`");

    //Pause the stream if queue.playing === false
    if (queue.playing === false) {
        try {
            dispatcher.pause()
        } catch (ex) {
            console.log(ex);
            return message.channel.send(message.client.emotes.error + " **Error:** `Pausing`");
        }
        handleStopCooldown(message);
    }
}

module.exports = { player }