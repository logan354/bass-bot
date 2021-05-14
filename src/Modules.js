const { player } = require('./structures/Player')
const { createQueue } = require('./structures/Queue')
const { resolveQueryType, searchTracks } = require('./structures/Search')
const { handleTrack, handlePlaylist } = require('./structures/Track')
const { formatTime, util } = require('./structures/Util')



async function join(message) {

    //Variables
    let voiceChannel = message.member.voice.channel;
    let textChannel = message.channel;

    const serverQueue = message.client.queue.get(message.guild.id);

    if (message.guild.me.voice.channel) return
    else {

        //Try connect to the voice channel
        try {
            const connection = await voiceChannel.join();
            connection.voice.setSelfDeaf(true);
            //queueConstruct.connection = connection;
            message.channel.send(`:white_check_mark: - **Successfully joined ` + '`' + voiceChannel.name + '` and bound to** <#' + textChannel.id + '>');

        } catch (ex) {
            message.client.queue.delete(message.guild.id);
            await voiceChannel.leave();
            console.log(ex)
            return message.channel.send(':x: - **Error: Joining voice channel** ' + '`' + voiceChannel.name + '`**: Status code: ERR_JOIN**');

        }
    }

    createQueue(message);
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
        return message.channel.send(':x: - **Error: Leaving voice channel** ' + '`' + voiceChannel.name + '`**: Status code: ERR_DISCONNECT**');
    }

    message.channel.send(':mailbox_with_no_mail: - **Successfully disconnected**');

}



async function play(message, url, query) {

    //Variables
    let voiceChannel = message.member.voice.channel;
    let textChannel = message.channel;

    const serverQueue = message.client.queue.get(message.guild.id);

    if (message.guild.me.voice.channel);
    else {

        //Try connect to the voice channel
        try {
            const connection = await voiceChannel.join();
            connection.voice.setSelfDeaf(true);
            //queueConstruct.connection = connection;
            message.channel.send(`:white_check_mark: - **Successfully joined ` + '`' + voiceChannel.name + '` and bound to** <#' + textChannel.id + '>');

        } catch (ex) {
            message.client.queue.delete(message.guild.id);
            await voiceChannel.leave();
            console.log(ex)
            return message.channel.send(':x: - **Error: Joining voice channel** ' + '`' + voiceChannel.name + '`**: Status code: ERR_JOIN**');

        }
    }

    createQueue(message);

    queryType = resolveQueryType(url, query)
    searchTracks(message, url, query, queryType)
    
}



function resume(message) {

    //Variables
    let voiceChannel = message.member.voice.channel;
    let textChannel = message.channel;

    const serverQueue = message.client.queue.get(message.guild.id);

    if (serverQueue.playing === true) return message.channel.send(`:x: - **The player is not paused**`);

    if (serverQueue.tracks.length === 0) {
        serverQueue.playing = true
        return message.channel.send(':play_pause: - **Resuming**')
    }

    serverQueue.playing = true;
    serverQueue.connection.dispatcher.resume()
    try {
        //serverQueue.connection.dispatcher.resume()
    } catch (ex) {
        serverQueue.voiceChannel.leave()
        message.client.queue.delete(message.guild.id);
        console.log(ex)
        return message.channel.send(`:x: - **Error: Resuming player (Queue has been cleared): Status code: ERR_RESUME**`);
    }
    message.channel.send(':play_pause: - **Resuming**')

}



function pause(message) {

    //Variables
    let voiceChannel = message.member.voice.channel;
    let textChannel = message.channel;

    const serverQueue = message.client.queue.get(message.guild.id);

    if (serverQueue.playing === false) return message.channel.send(`:x: - **The player is already paused**`);

    if (serverQueue.tracks.length === 0) {
        serverQueue.playing = false
        return message.channel.send(':play_pause: - **Paused**')
    }

    serverQueue.playing = false;
    try {
        serverQueue.connection.dispatcher.pause()
    } catch (ex) {
        serverQueue.voiceChannel.leave()
        message.client.queue.delete(message.guild.id);
        console.log(ex)
        return message.channel.send(`:x: - **Error: Pausing player (Queue has been cleared): Status code: ERR_PAUSE**`);
    }
    message.channel.send(':play_pause: - **Paused**')
}



function skip(message) {

    //Variables
    let voiceChannel = message.member.voice.channel;
    let textChannel = message.channel;

    const serverQueue = message.client.queue.get(message.guild.id);

    if (!serverQueue.connection) return

    if (!serverQueue.connection.dispatcher) return

    const voiceChannelSize = voiceChannel.members.array().length - 1 //Minus one for the bot

    if (voiceChannelSize > 2) {
        const voteAmountDouble = voiceChannelSize * 0.75
        const voteAmount = Math.trunc(voteAmountDouble);

        if (serverQueue.skiplist.includes(message.author.id)) {
            return message.channel.send(':x: - **You already voted to skip the current song** (' + serverQueue.skiplist.length + '/' + voteAmount + ' people)')
        }

        serverQueue.skiplist.push(message.author.id);


        if (serverQueue.skiplist.length >= voteAmount) {
            try {
                serverQueue.connection.dispatcher.end()
            } catch (ex) {
                serverQueue.voiceChannel.leave()
                message.client.queue.delete(message.guild.id);
                console.log(ex)
                return message.channel.send(`:x: - **Error: Skipping music (Queue has been cleared): Status code: ERR_SKIP**`);
            }
            message.channel.send(':fast_forward: - **Skipped**')
        }
        else return message.channel.send('**Skipping?** (' + serverQueue.skiplist.length + '/' + voteAmount + ' people)')

    }

    else {
        try {
            serverQueue.connection.dispatcher.end()
        } catch (ex) {
            serverQueue.voiceChannel.leave()
            message.client.queue.delete(message.guild.id);
            console.log(ex)
            return message.channel.send(`:x: - **Error: Skipping music (Queue has been cleared): Status code: ERR_SKIP**`);
        }
        message.channel.send(':fast_forward: - **Skipped**')
    }
}

module.exports = { join, disconnect, play, resume, pause, skip }

//console.log(serverQueue.connection.dispatcher.streamTime) //Current play time
