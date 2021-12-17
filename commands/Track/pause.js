module.exports = {
    name: "pause",
    aliases: ["stop"],
    category: "Track",
    description: "Pauses the current playing track.",
    utilisation: "{prefix}pause",
    permissions: {
        channel: [],
        member: [],
    },

    execute(client, message, args) {
        const serverQueue = client.queues.get(message.guild.id);
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!message.guild.me.voice.channel) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.app.prefix + "join" + "`" + " to get me in one");

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (serverQueue.paused) return message.channel.send(client.emotes.error + " **The player is already paused**");

        serverQueue.streamDispatcher.audioPlayer.pause();
        serverQueue.paused = true;
        message.channel.send(client.emotes.pause + " **Paused**");
    }
}