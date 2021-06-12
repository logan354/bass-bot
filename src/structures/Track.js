//Local functions
const { player } = require("./Player")
const { Util } = require("../utils/Util")

//handleTrack handles the input of a track a pushes it to the queue
async function handleTrack(message, track) {
    let voiceChannel = message.member.voice.channel;
    let textChannel = message.channel;

    var serverQueue = message.client.queue.get(message.guild.id);

    //If a track is already enqueued then add the track to the queue
    if (serverQueue.tracks.length > 0) {

        serverQueue.tracks.push(track);
        serverQueue.duration += track.duration;

        return message.channel.send({
            embed: {
                color: "BLACK",
                author: {
                    name: "Added to queue",
                    icon_url: Util.emojis.player,
                },
                description: `**[${track.title}](${track.displayURL})**`,
                thumbnail: { url: track.image },

                fields: [

                    { name: "Channel", value: track.channel, inline: true },
                    { name: "Song Duration", value: track.durationFormatted, inline: true },
                    //{ name: "Estimated time until QUEUEING", value: "?", inline: true }, //Not Accurate

                    { name: "Position in queue", value: serverQueue.tracks.length - 1, inline: true },
                    { name: "\u200B", value: "**Requested by:** " + "<@" + track.requestedBy.id + ">" }
                ],
            },
        })
    }

    //If a not then add the track to the queue
    serverQueue.tracks.push(track);
    serverQueue.duration += track.duration;

    //Try to play track
    try {
        const connection = await voiceChannel.join();
        connection.voice.setSelfDeaf(true);
        serverQueue.connection = connection;
        player(message, serverQueue.tracks[0]);
    } catch (ex) {
        console.log(ex);
        return message.channel.send(Util.emojis.error + " **Error:** QUEUEING");

    }
}



//handlePlaylist handles the input of a playlist and pushes it to the queue
async function handlePlaylist(message, track) {
    let voiceChannel = message.member.voice.channel;
    let textChannel = message.channel;

    var serverQueue = message.client.queue.get(message.guild.id);

    //If a serverQueue there is a track already enqueued then add the track to the queue
    if (serverQueue.tracks.length > 0) {

        serverQueue.tracks.push(track);
        serverQueue.duration += track.duration;
        return

    }

    //If a not then add the track to the queue
    serverQueue.tracks.push(track);
    serverQueue.duration += track.duration;

    //Try to play track
    try {
        const connection = await voiceChannel.join();
        connection.voice.setSelfDeaf(true);
        serverQueue.connection = connection;
        player(message, serverQueue.tracks[0]);
    } catch (ex) {
        console.log(ex);
        return message.channel.send(Util.emojis.error + " **Error:** QUEUEING");

    }
}

module.exports = { handleTrack, handlePlaylist }