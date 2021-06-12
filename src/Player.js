//Local functions
const { createQueue } = require("./structures/Queue")
const { searchTracks } = require("./structures/Search")
const { Util } = require("./utils/Util")

class Player {
    async join(message) {
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
            Util.cooldown(message);
            message.channel.send(Util.emojis.success + " **Successfully joined `" + voiceChannel.name + "` and bound to** <#" + textChannel.id + ">");

        } catch (ex) {
            console.log(ex)
            return message.channel.send(Util.emojis.error + " **Error:** JOINING " + voiceChannel.name);

        }
    }



    async disconnect(message) {
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
            return message.channel.send(Util.emojis.error + " **Error:** LEAVING " + voiceChannel.name);
        }

        message.channel.send(Util.emojis.disconnect + " **Successfully disconnected**");
    }



    async play(message, url, query) {
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
                Util.cooldown(message);
                message.channel.send(Util.emojis.success + " **Successfully joined `" + voiceChannel.name + "` and bound to** <#" + textChannel.id + ">");

            } catch (ex) {
                console.log(ex)
                return message.channel.send(Util.emojis.error + " **Error:** JOINING " + voiceChannel.name);

            }
        }

        searchTracks(message, url, query, Util.resolveQueryType(url, query))
    }



    resume(message) {
        //Variables
        let voiceChannel = message.member.voice.channel;
        let textChannel = message.channel;

        const serverQueue = message.client.queue.get(message.guild.id);

        if (serverQueue.playing === true) return message.channel.send(Util.emojis.error + " **The player is not paused**");

        if (serverQueue.tracks.length === 0) {
            serverQueue.playing = true
            return message.channel.send(Util.emojis.resume + " **Resuming**")
        }

        try {
            //This is a bug in discord.js#5300
            serverQueue.connection.dispatcher.resume()
            serverQueue.connection.dispatcher.pause()
            serverQueue.connection.dispatcher.resume()
            serverQueue.playing = true
        } catch (ex) {
            console.log(ex);
            return message.channel.send(Util.emojis.error + " **Error:** RESUMING");
        }
        message.channel.send(Util.emojis.resume + " **Resuming**")
    }



    pause(message) {
        //Variables
        let voiceChannel = message.member.voice.channel;
        let textChannel = message.channel;

        const serverQueue = message.client.queue.get(message.guild.id);

        if (serverQueue.playing === false) return message.channel.send(Util.emojis.error + " **The player is already paused**");

        if (serverQueue.tracks.length === 0) {
            serverQueue.playing = false
            return message.channel.send(Util.emojis.pause + " **Paused**")
        }

        try {
            serverQueue.connection.dispatcher.pause()
            serverQueue.playing = false
            Util.cooldown(message);
        } catch (ex) {
            console.log(ex);
            return message.channel.send(Util.emojis.error + " **Error:** PAUSING");
        }
        message.channel.send(Util.emojis.pause + " **Paused**")
    }



    skip(message) {
        //Variables
        let voiceChannel = message.member.voice.channel;
        let textChannel = message.channel;

        const serverQueue = message.client.queue.get(message.guild.id);

        const voiceChannelSize = voiceChannel.members.filter(m => !m.user.bot).size //Gets the amount of users in the Voice Channel (execpt bots)

        if (voiceChannelSize > 2) { //Check if the amount of users in the Voice Channel is greater than 2
            const voteAmountDouble = voiceChannelSize * 0.75
            const voteAmount = Math.trunc(voteAmountDouble);

            if (serverQueue.skiplist.includes(message.author.id)) { //If user has already voted then return
                return message.channel.send(Util.emojis.error + " **You already voted to skip the current song** (" + serverQueue.skiplist.length + "/" + voteAmount + " people)")
            }

            serverQueue.skiplist.push(message.author.id); //Push the users ID to the skiplist

            if (serverQueue.skiplist.length >= voteAmount) { //If the skiplist.length >= voteAmount the skip the current track
                try {
                    serverQueue.connection.dispatcher.end()
                } catch (ex) {
                    console.log(ex);
                    return message.channel.send(Util.emojis.error + " **Error:** SKIPPING");
                }
                message.channel.send(Util.emojis.skip + " **Skipped**")
            }
            else return message.channel.send("**Skipping?** (" + serverQueue.skiplist.length + "/" + voteAmount + " people)") //If the skiplist.length < voteAmount then return

        }

        else { //If the amount of users in the Voice Channel is less than 2 then skip the current track
            try {
                serverQueue.connection.dispatcher.end()
            } catch (ex) {
                console.log(ex);
                return message.channel.send(Util.emojis.error + " **Error:** SKIPPING");
            }
            message.channel.send(Util.emojis.skip + " **Skipped**")
        }
    }



    loop(message) {
        //Variables
        let voiceChannel = message.member.voice.channel;
        let textChannel = message.channel;

        const serverQueue = message.client.queue.get(message.guild.id);

        if (serverQueue.loop === true) {
            serverQueue.loop = false
            return message.channel.send(Util.emojis.loop + " **Disabled**")
        }
        else {
            serverQueue.loop = true
            return message.channel.send(Util.emojis.loop + " **Enabled**")
        }
    }



    loopQueue(message) {
        //Variables
        let voiceChannel = message.member.voice.channel;
        let textChannel = message.channel;

        const serverQueue = message.client.queue.get(message.guild.id);

        if (serverQueue.loopQueue === true) {
            serverQueue.loopQueue = false
            return message.channel.send(Util.emojis.loopQueue + " **Disabled**")
        }
        else {
            serverQueue.loopQueue = true
            return message.channel.send(Util.emojis.loopQueue + " **Enabled**")
        }
    }



    shuffle(message) {
        //Variables
        let voiceChannel = message.member.voice.channel;
        let textChannel = message.channel;

        const serverQueue = message.client.queue.get(message.guild.id);

        //Current shuffle system taken from discord-player
        const currentTrack = serverQueue.tracks.shift();

        for (let i = serverQueue.tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [serverQueue.tracks[i], serverQueue.tracks[j]] = [serverQueue.tracks[j], serverQueue.tracks[i]];
        }

        serverQueue.tracks.unshift(currentTrack);

        message.channel.send(Util.emojis.shuffle + " **Shuffled**")
    }
}

module.exports = { Player }

//console.log(serverQueue.connection.dispatcher.streamTime) //Current play time
