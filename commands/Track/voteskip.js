const { Client, Message } = require("discord.js");

module.exports = {
    name: "voteskip",
    aliases: ["skip", "next", "s"],
    category: "Track",
    description: "Votes to skip the currently playing song.",
    utilisation: "{prefix}voteskip",

    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
    execute(client, message, args) {
        const serverQueue = client.queues.get(message.guild.id);
        const voiceChannel = message.member.voice.channel;
        const activationNum = 2;

        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!message.guild.me.voice.channel) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.app.prefix + "join" + "`" + " to get me in one");

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (!serverQueue.tracks.length) return message.channel.send(client.emotes.error + " **Nothing playing in this server**, let's get this party started! :tada:");

        // Gets the amount of users in the voice channel (except bots)
        const voiceChannelSize = voiceChannel.members.filter(m => !m.user.bot).size;

        if (voiceChannelSize > activationNum) {
            const requiredVotes = Math.trunc(voiceChannelSize * 0.75);

            if (serverQueue.skiplist.includes(message.author.id)) {
                return message.channel.send(client.emotes.error + " **You already voted to skip the current song** (" + serverQueue.skiplist.length + "/" + requiredVotes + " people)");
            }
            else serverQueue.skiplist.push(message.author.id);

            if (serverQueue.skiplist.length >= requiredVotes) {
                serverQueue.streamDispatcher.audioPlayer.stop();
                message.channel.send(client.emotes.skip + " **Skipped**");
            } else message.channel.send("**Skipping?** (" + serverQueue.skiplist.length + "/" + requiredVotes + " people)");
        }
        else {
            serverQueue.streamDispatcher.audioPlayer.stop();
            message.channel.send(client.emotes.skip + " **Skipped**");
        }
    }
}