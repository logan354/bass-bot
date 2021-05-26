const { player } = require("./structures/Player")
const { createQueue } = require("./structures/Queue")
const { searchTracks } = require("./structures/Search")
const { handleTrack, handlePlaylist } = require("./structures/Track")
const { formatTime, resolveQueryType, util } = require("./structures/Util")




async function join(message) {

    //Variables
    let voiceChannel = message.member.voice.channel;
    let textChannel = message.channel;

    createQueue(message);

    const serverQueue = message.client.queue.get(message.guild.id);

        //Try connect to the voice channel
        try {
            const connection = await voiceChannel.join();
            connection.voice.setSelfDeaf(true);
            serverQueue.connection = connection;
            message.channel.send(":white_check_mark: **Successfully joined `" + voiceChannel.name + "` and bound to** <#" + textChannel.id + ">");

        } catch (ex) {
            message.client.queue.delete(message.guild.id);
            await voiceChannel.leave();
            console.log(ex)
            return message.channel.send(":x: **Error:** Joining voice channel " + voiceChannel.name);

        }

}



async function disconnect(message) {

    //Variables
    let voiceChannel = message.member.voice.channel;
    let textChannel = message.channel;

    const serverQueue = message.client.queue.get(message.guild.id);

    //Try leave the voice channel
    try {
        message.client.queue.delete(message.guild.id);
        await voiceChannel.leave();
    }
    catch (ex) {
        console.log(ex)
        return message.channel.send(":x: **Error:** Leaving voice channel " + voiceChannel.name);
    }

    message.channel.send(":mailbox_with_no_mail: **Successfully disconnected**");

}



async function play(message, url, query) {

    //Variables
    let voiceChannel = message.member.voice.channel;
    let textChannel = message.channel;

    createQueue(message);

    const serverQueue = message.client.queue.get(message.guild.id);

    if (message.guild.me.voice.channel);
    else {
        //Try connect to the voice channel
        try {
            const connection = await voiceChannel.join();
            connection.voice.setSelfDeaf(true);
            serverQueue.connection = connection;
            message.channel.send(":white_check_mark: **Successfully joined `" + voiceChannel.name + "` and bound to** <#" + textChannel.id + ">");

        } catch (ex) {
            message.client.queue.delete(message.guild.id);
            await voiceChannel.leave();
            console.log(ex)
            return message.channel.send(":x: **Error:** Joining voice channel " + voiceChannel.name);

        }
    }

    searchTracks(message, url, query, resolveQueryType(url, query))
    
}



function resume(message) {

    //Variables
    let voiceChannel = message.member.voice.channel;
    let textChannel = message.channel;

    const serverQueue = message.client.queue.get(message.guild.id);

    if (serverQueue.playing === true) return message.channel.send(":x: **The player is not paused**");

    if (serverQueue.tracks.length === 0) {
        serverQueue.playing = true
        return message.channel.send(":play_pause: **Resuming**")
    }

    try {
        serverQueue.connection.dispatcher.resume()
        serverQueue.playing = true
    } catch (ex) {
        serverQueue.voiceChannel.leave()
        message.client.queue.delete(message.guild.id);
        console.log(ex)
        return message.channel.send(":x: **Error:** Resuming player (Queue has been cleared)");
    }
    message.channel.send(":play_pause: **Resuming**")

}



function pause(message) {

    //Variables
    let voiceChannel = message.member.voice.channel;
    let textChannel = message.channel;

    const serverQueue = message.client.queue.get(message.guild.id);

    if (serverQueue.playing === false) return message.channel.send(":x: **The player is already paused**");

    if (serverQueue.tracks.length === 0) {
        serverQueue.playing = false
        return message.channel.send(":pause_button: **Paused**")
    }

    try {
        serverQueue.connection.dispatcher.pause()
        serverQueue.playing = false
    } catch (ex) {
        serverQueue.voiceChannel.leave()
        message.client.queue.delete(message.guild.id);
        console.log(ex)
        return message.channel.send(":x: **Error:** Pausing player (Queue has been cleared)");
    }
    message.channel.send(":pause_button: **Paused**")

}



function skip(message) {

    //Variables
    let voiceChannel = message.member.voice.channel;
    let textChannel = message.channel;

    const serverQueue = message.client.queue.get(message.guild.id);

    const voiceChannelSize = voiceChannel.members.filter(m => !m.user.bot).size //Gets the amount of users in the Voice Channel (execpt bots)

    if (voiceChannelSize > 2) { //Check if the amount of users in the Voice Channel is greater than 2
        const voteAmountDouble = voiceChannelSize * 0.75
        const voteAmount = Math.trunc(voteAmountDouble);

        if (serverQueue.skiplist.includes(message.author.id)) { //If user has already voted then return
            return message.channel.send(":x: **You already voted to skip the current song** (" + serverQueue.skiplist.length + "/" + voteAmount + " people)")
        }

        serverQueue.skiplist.push(message.author.id); //Push the users ID to the skiplist

        if (serverQueue.skiplist.length >= voteAmount) { //If the skiplist.length >= voteAmount the skip the current track
            try {
                serverQueue.connection.dispatcher.end()
            } catch (ex) {
                serverQueue.voiceChannel.leave()
                message.client.queue.delete(message.guild.id);
                console.log(ex)
                return message.channel.send(":x: **Error:** Skipping music (Queue has been cleared)");
            }
            message.channel.send(":track_next: **Skipped**")
        }
        else return message.channel.send("**Skipping?** (" + serverQueue.skiplist.length + "/" + voteAmount + " people)") //If the skiplist.length < voteAmount then return

    }

    else { //If the amount of users in the Voice Channel is less than 2 then skip the current track
        try {
            serverQueue.connection.dispatcher.end()
        } catch (ex) {
            serverQueue.voiceChannel.leave()
            message.client.queue.delete(message.guild.id);
            console.log(ex)
            return message.channel.send(":x: **Error:** Skipping music (Queue has been cleared)");
        }
        message.channel.send(":track_next: **Skipped**")
    }

}

module.exports = { join, disconnect, play, resume, pause, skip }

//console.log(serverQueue.connection.dispatcher.streamTime) //Current play time
