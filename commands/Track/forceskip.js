const { Client, Message } = require("discord.js");

module.exports = {
    name: "forceskip",
    aliases: ["fs", "fskip"],
    category: "Track",
    description: "Force skips the song that is currently playing",
    utilisation: "{prefix}forceskip [number]",

    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
    execute(client, message, args) {
        const serverQueue = client.queues.get(message.guild.id);
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!message.guild.me.voice.channel) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.app.prefix + "join" + "`" + " to get me in one");

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (!serverQueue.tracks.length) return message.channel.send(client.emotes.error + " **Nothing playing in this server**, let's get this party started! :tada:");

        // Gets the amount of users in the voice channel (except bots)
        const voiceChannelSize = voiceChannel.members.filter(m => !m.user.bot).size;

        if (voiceChannelSize > 1 && !message.member.hasPermission("MANAGE_CHANNELS")) return message.channel.send(client.emotes.error + " **This command requires you to have the Manage Channels permission to use it (being alone with the bot also works)**");

        if (!args[0]) {
            serverQueue.streamDispatcher.audioPlayer.stop();
            return message.channel.send(client.emotes.skip + " **Skipped**");
        }

        let skipNum = Number(args[0]);

        if (!skipNum) return message.channel.send(client.emotes.error + " **Value must be a number**");

        if (skipNum <= 0) return message.channel.send(client.emotes.error + " **Value must be a number greater than 1**");

        if (skipNum > serverQueue.tracks.length) skipNum = serverQueue.tracks.length;

        // Skip single track
        if (skipNum === 1 || serverQueue.tracks.length === 1) {
            serverQueue.streamDispatcher.audioPlayer.stop();
            return message.channel.send(client.emotes.skip + " **Skipped**");
        } 

        // Skip multiple tracks
        for (let i = 0; i < skipNum - 1; i++) {
            serverQueue.tracks.shift();
        }

        serverQueue.streamDispatcher.audioPlayer.stop();
        return message.channel.send(client.emotes.skip + " **Skipped " + skipNum + " songs**");
    }
}
