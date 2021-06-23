//Web functions
const ytdl = require("discord-ytdl-core");
var ytpl = require("ytpl");
const scdl = require("soundcloud-downloader").default;
const spotify = require("spotify-url-info")
const ytsr = require("youtube-sr").default;

//Local functions
const { Util } = require("../utils/Util")

async function player(message, track) {
    const queue = message.client.queue.get(message.guild.id);
    if (!track) {
        Util.cooldown(message);
        return;
    }

    let stream;
    let streamType;

    try {
        if (track.url.includes("soundcloud.com")) {
            try {
                stream = await scdl.downloadFormat(track.url, scdl.FORMATS.OPUS);
            } catch (ex) {
                stream = await scdl.downloadFormat(track.url, scdl.FORMATS.MP3);
                streamType = "unknown";
            }
        } else if (track.url.includes("youtube.com" || "spotify.com")) {
            stream = await ytdl(track.url, { filter: "audio", quality: "highestaudio", highWaterMark: 1 << 25, opusEncoded: true }); //filter: audioonly does not work with livestreams
            streamType = "opus";
            stream.on("error", function (ex) {
                if (ex) {
                    if (queue) {
                        queue.tracks.shift();
                        player(message, queue.tracks[0]);
                        console.log(ex)
                        return message.channel.send(Util.emojis.error + " **Error: Playing:** `" + ex.message + "`");
                    }
                }
            });
        }
    } catch (ex) {
        if (queue) {
            queue.tracks.shift();
            player(message, queue.tracks[0]);
            console.log(ex)
            return message.channel.send(Util.emojis.error + " **Error: Playing:** `" + ex.message + "`")
        }
    }

    //Start the stream and set actions on finish
    queue.connection.on("disconnect", () => message.client.queue.delete(message.guild.id))
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
            queue.skiplist = []
            queue.duration -= queue.tracks[0].duration
            queue.tracks.shift();
            player(message, queue.tracks[0]);
        }

        Util.cooldown(message);

    });

    //Set volume
    dispatcher.setVolumeLogarithmic(queue.volume / 100)

    //Show playing message
    message.channel.send(Util.emojis.playerFrozen + " **Now Playing** `" + track.title + "`")

    //Pause the stream if queue.playing === false
    if (queue.playing === false) {
        try {
            dispatcher.pause()
            Util.cooldown(message);
        } catch (ex) {
            console.log(ex);
            return message.channel.send(Util.emojis.error + " **Error:** `Pausing`");
        }
    }
}

module.exports = { player }