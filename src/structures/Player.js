const ytdl = require('discord-ytdl-core');
var ytpl = require("ytpl");
const ytsr = require("youtube-sr").default;
const spotify = require("spotify-url-info")
const scdl = require("soundcloud-downloader").default;

//Player which streams the songs through the bot
async function player(message, track) {

    const queue = message.client.queue.get(message.guild.id);
    if (!track) {
        message.guild.me.voice.channel.leave(); //If you want your bot stay in vc 24/7 remove this line :D
        message.client.queue.delete(message.guild.id);
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
        } else if (track.url.includes("youtube.com")) {
            stream = await ytdl(track.url, { filter: "audio", quality: "highestaudio", highWaterMark: 1 << 25, opusEncoded: true }); //filter: audioonly does not work with livestreams
            streamType = "opus";
            stream.on("error", function (ex) {
                if (ex) {
                    if (queue) {
                        queue.tracks.shift();
                        player(message, queue.tracks[0]);
                        console.log(ex)
                        return message.channel.send(':x: - **Error: Decodeding link/query: Status code: ERR_DECODEDING**');
                    }
                }
            });
        }
    } catch (ex) {
        if (queue) {
            queue.tracks.shift();
            player(message, queue.tracks[0]);
        }
    }

    queue.connection.on("disconnect", () => message.client.queue.delete(message.guild.id))
    const dispatcher = queue.connection.play(stream, { type: streamType }).on("finish", () => {

        //Variables that need to be reset
        queue.skiplist = []
        queue.totalTime -= queue.tracks[0].duration

        //Check if queue is loopped or track is loopped
        if (queue.loop === true) {
            player(message, queue.tracks[0]);
        }
        else {
            const shiffed = queue.tracks.shift();
            if (queue.loopQueue === true) {
                queue.tracks.push(shiffed);
            }
            player(message, queue.tracks[0]);
        }
    });

    dispatcher.setVolumeLogarithmic(queue.volume / 100);

    function emoji(id) {
        return message.client.emojis.cache.get(id).toString()
    }
    message.channel.send(emoji('832565313739685888') + ' - **Now Playing** `' + track.title + '`')
};

module.exports = { player }